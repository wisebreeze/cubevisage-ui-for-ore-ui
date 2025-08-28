window.engine = (function() {
  const eventHandlers = new Map()
  
  const languages = window.serverLanguages
  
  const USE_GAMEPLAY_ROUTES = config?.devServer?.use_gameplay_routes
  const USE_DEFAULT_ROUTES = config?.devServer?.use_default_routes

  const inputMethods = {
    GAMEPAD_INPUT_METHOD: 0,
    TOUCH_INPUT_METHOD: 1,
    MOUSE_INPUT_METHOD: 2,
    MOTION_CONTROLLER_INPUT_METHOD: 3
  }

  const platforms = {
    IOS: 0,
    GOOGLE: 1,
    AMAZON_HANDHELD: 2,
    UWP: 3,
    XBOX: 4,
    NX_HANDHELD: 5,
    PS4: 6,
    GEARVR: 7,
    WIN32: 8,
    MACOS: 9,
    AMAZON_TV: 10,
    NX_TV: 11,
    PS5: 12
  }
  
  const featureFlags = {
    flags: [
      'vanilla.achievementsReward',
      'vanilla.editor.enableUI',
      'vanilla.serverTab',
      'vanilla.settings.unlockRecipes',
      'vanilla.friendsDrawer',
      'vanilla.debugDrawer',
      'core.hasRealmsEnabled',
      'core.hasRealmsStoriesEnabled',
      'vanilla.playScreenRealmsTab',
      'vanilla.hardcoreMode'
    ]
  }

  const sound = {
    play: id => console.log(`[CubeVisage] Reading the ${id} sound`) ||
      fetch("/src/sounds/sound_definitions.json")
        .then(r => r.json())
        .then(data => {
          const sounds = data.sound_definitions?.[id]?.sounds || data[id]?.sounds
          const randomSound = sounds?.[Math.random() * sounds.length | 0]?.name
          randomSound && console.log(`[CubeVisage] Play ${randomSound}`)
        })
  }

  let routeRegistry = []
  const router = {
    history: {
      length: 1,
      _stack: [],
      routers: [],
      get list() {
        return this._stack.length === 0 ? [
          {
            pathname: USE_DEFAULT_ROUTES,
            search: "",
            hash: "",
            state: ""
          }
        ] : this._stack
      },
      set list(_) {
        // 防止外部写入
      },

      // 把 routeRegistry 条目转成 location 对象
      _toLocation(routeStr, state = null) {
        let pathname = routeStr
        let search = ""
        let hash = ""

        const q = pathname.indexOf("?")
        if (q !== -1) {
          search = pathname.slice(q)
          pathname = pathname.slice(0, q)
        }
        const h = pathname.indexOf("#")
        if (h !== -1) {
          hash = pathname.slice(h)
          pathname = pathname.slice(0, h)
        }

        return {
          pathname,
          search,
          hash,
          state,
          key: Math.random().toString(36).substr(2, 6)
        }
      },

      // 初始化栈
      _init(routers) {
        if (!routers.map) return
        const toLocation = this._toLocation
        this.routers = routers.map(e => toLocation(e.route))
      },

      // 路由匹配
      _match(pathname) {
        return routeRegistry.find(r => new RegExp(r.regexp).test(pathname))
      },

      // 公开方法
      action: "REPLACE",
      push(pathOrLoc, state) {
        let nextLoc
        if (typeof pathOrLoc === "string") {
          nextLoc = this._toLocation(pathOrLoc, state)
        } else {
          nextLoc = this._toLocation(pathOrLoc.pathname, pathOrLoc.state)
          nextLoc.search = pathOrLoc.search || ""
          nextLoc.hash = pathOrLoc.hash || ""
          nextLoc.key = Math.random().toString(36).substr(2, 6)
        }

        if (!this._match(nextLoc.pathname)) {
          window.engine.trigger("core:routing:not-found")
          return
        }

        this.action = "PUSH"
        this._stack.push(nextLoc)
        Object.assign(this.location, nextLoc)
      },

      replace(pathOrLoc, state) {
        let nextLoc
        if (typeof pathOrLoc === "string") {
          nextLoc = this._toLocation(pathOrLoc, state)
        } else {
          nextLoc = this._toLocation(pathOrLoc.pathname, pathOrLoc.state)
          nextLoc.search = pathOrLoc.search || ""
          nextLoc.hash = pathOrLoc.hash || ""
          nextLoc.key = Math.random().toString(36).substr(2, 6)
        }

        if (!this._match(nextLoc.pathname)) {
          window.engine.trigger("core:routing:not-found")
          return
        }

        this.action = "REPLACE"
        this._stack.splice(-1, 1, nextLoc)
        Object.assign(this.location, nextLoc)
      },

      goBack() {
        if (this._stack.length > 1) {
          this.action = "POP"
          this._stack.pop()
          Object.assign(this.location, this._stack[this._stack.length - 1])
        }
      },

      go(n) {
        console.warn("go() not implemented yet")
      }
    }
  }

  fetch('/hbui/routes.json')
    .then(r => r.json())
    .then(data => {
      const file = USE_GAMEPLAY_ROUTES ? '/hbui/gameplay.html' : '/hbui/index.html'
      const group = data.routes.find(r => r.fileName === file)
      if (group) {
        routeRegistry = group.supportedRoutes
        router.history._init(group.supportedRoutes)
        // console.log(`[CubeVisage] Router initialized with default route:`, router.history.routers)
      }
    })
    .catch(error => {
      console.error('[CubeVisage] Failed to load routes.json:', error)
    })

  const PlayerTitleHistory = {
    Unknown: 0,
    NotPlayed: 1,
    HasPlayed: 2
  }

  const RelationToCurrentUser = {
    Self: 0,
    TwoWayFriend: 1,
    Following: 2,
    Follower: 3,
    Stranger: 4
  }

  const optionsType = {
    Number: 0,
    Boolean: 1,
    String: 2,
    Option: 3,
    Action: 4,
    Text: 5,
  }

  const settings = {
    sounds: {
      settings: [
        
      ]
    },
    video: {
      settings: [
        // { id: "test", type: optionsType.Number, name: "测试", description: "描述", value: 75, min: 0, max: 100, step: 5, valueText: "75%," },
      ]
    }
  }
  const facetTaskState = {
    IDLE: 0,
    RUNNING: 1,
    DONE: 2,
    CANCELLED: 3,
    FAILED: 4
  }
  const xblLoadingState = {
    Unavailable: 0,
    Loading: 1,
    Ready: 2,
    Error: 3
  }
  const daylightCycleEnum = {
    NORMAL: 0,
    ALWAYS_DAY: 1,
    LOCK_TIME: 2
  }
  const experimentalFeatureCategory = {
    GAMEPLAY: 0,
    ADD_ON_CREATORS: 1,
    INTERNAL_TESTS: 2
  }
  const biomeDimension = {
    OVERWORLD: 0,
    NETHER: 1
  }

  const mockPlayerEmpty = {
    xuid: '1000',
    gamerTag: '',
    gamerIcon: '',
    avatar: '',
    isOnline: false,
    isCurrentlyPlaying: false,
    relation: RelationToCurrentUser.Stranger,
    realName: '',
    isBlocked: false,
    isMuted: false,
    qrCode: '',
    platformId: platforms.GOOGLE,
    playingOnServerId: '',
    titleHistory: PlayerTitleHistory.HasPlayed,
    url: ''
  }
  const mockPlayerSelf = {
    xuid: '1717',
    gamerTag: 'CoolGamer123',
    gamerIcon: '',
    avatar: '',
    isOnline: true,
    isCurrentlyPlaying: false,
    relation: RelationToCurrentUser.Self,
    realName: 'Really McReal',
    isBlocked: false,
    isMuted: false,
    qrCode: '',
    platformId: platforms.GOOGLE,
    playingOnServerId: '',
    titleHistory: PlayerTitleHistory.HasPlayed,
    url: ''
  }

  const createNewWorld = {
    isEditorWorld: false,
    isUsingTemplate: false,
    isLockedTemplate: false,
    generalWarningState: 0,
    showedAchievementWarning: false,
    applyTemplate: function () {},
    createOnRealms: {
      call: function () {},
      error: null
    },
    worldData: {
      currentWorldId: 'world-id',
      isUsingTemplate: false,
      general: {
        worldName: "My World",
        difficulty: 0,
        gameMode: 0,
        isHardcore: false
      },
      advanced: {
        worldSeed: '',
        useFlatWorld: false,
        generatorType: 1,
        startWithMap: false,
        bonusChest: false,
        showCoordinates: false,
        showDaysPlayed: false,
        recipesUnlock: false,
        firesSpreads: true,
        tntExplodes: true,
        respawnBlocksExplode: true,
        mobLoot: true,
        naturalRegeneration: true,
        tileDrops: true,
        immediateRespawn: false,
        respawnRadius: '5',
        simulationDistance: 8
      },
      cheats: {
        cheatsEnabled: true,
        commandsEnabled: true,
        daylightCycle: daylightCycleEnum.NORMAL,
        keepInventory: false,
        mobSpawning: false,
        mobGriefing: false,
        entitiesDropLoot: false,
        weather: false,
        commandBlocks: false,
        educationEdition: false,
        tickSpeed: '1'
      },
      betaFeatures: [
        {
          id: '0',
          title: 'Caves and cliffs blocks',
          description: 'Goats, snowier snow and what else might lurk behind the next block?',
          isEnabled: false,
          category: experimentalFeatureCategory.GAMEPLAY,
          isTogglePermanentlyDisabled: false
        },
        {
          id: '1',
          title: 'Cave generation',
          description: 'Explore the new varied cave generation',
          isEnabled: false,
          category: experimentalFeatureCategory.GAMEPLAY,
          isTogglePermanentlyDisabled: false
        },
        {
          id: '2',
          title: 'Custom Biomes',
          description: 'Create custom biomes and change world generation in your add-ons',
          isEnabled: false,
          category: experimentalFeatureCategory.ADD_ON_CREATORS,
          isTogglePermanentlyDisabled: false
        },
        {
          id: '3',
          title: 'Additional modding capabilities',
          description: 'Doing a lot of repetitive things? This might help creating your add-on',
          isEnabled: false,
          category: experimentalFeatureCategory.ADD_ON_CREATORS,
          isTogglePermanentlyDisabled: false
        },
        {
          id: '4',
          title: 'GameTest Framework',
          description: 'What is this?',
          isEnabled: false,
          category: experimentalFeatureCategory.ADD_ON_CREATORS,
          isTogglePermanentlyDisabled: false
        },
        {
          id: '5',
          title: 'Holiday Creator Features',
          description: 'Includes actor properties and data-driven fog volumes for add-ons',
          isEnabled: false,
          category: experimentalFeatureCategory.ADD_ON_CREATORS,
          isTogglePermanentlyDisabled: false
        }
      ],
      multiplayer: {
        generalWarningState: 0,
        multiplayerSupported: true,
        playerPermissions: 1,
        multiplayerGame: true,
        playerAccess: 1,
        visibleToLanPlayers: true,
        friendlyFire: true,
        platformPlayerAccess: 1,
        platformPlayerAccessSupported: true,
        platformPlayerAccessEnabled: true,
        platformPlayerInviteAccessSupported: true
      },
      resourcePacks: {
        sharedPacksEnabled: false
      }
    },
    worldSummary: {
      fileSize: '512 MB',
      lastSaved: '20 Aug 2025',
      worldIconPath: ''
    },
    isAchievementsEditDisabled: false,
    worldIsInitialized: true,
    addWorld: () => {},
    saveLocalWorld: () => {},
    clearSaveLocalWorldTaskState: () => {},
    saveLocalWorldError: undefined,
    saveLocalWorldTaskState: facetTaskState.IDLE,
    loadWorldError: undefined,
    loadWorldTaskState: facetTaskState.IDLE,
    isEditorWorld: false,
    worldHasBeenModified: false,
    reloadWorld: () => {}
  }

  const worldEditor = {
    generalData: {},
    multiplayerData: {},
    worldData: createNewWorld,
  }

  const allBiomes = [{
    label: 'Nether 1',
    id: 0,
    dimension: biomeDimension.NETHER
  }, {
    label: 'Nether 2',
    id: 1,
    dimension: biomeDimension.NETHER
  }, {
    label: 'Nether 3',
    id: 2,
    dimension: biomeDimension.NETHER
  }, {
    label: 'Random overworld biome',
    id: 4,
    dimension: biomeDimension.OVERWORLD
  }, {
    label: 'Overworld 2',
    id: 5,
    dimension: biomeDimension.OVERWORLD
  }, {
    label: 'Overworld 3',
    id: 6,
    dimension: biomeDimension.OVERWORLD
  }, {
    label: 'Overworld 4',
    id: 7,
    dimension: biomeDimension.OVERWORLD
  }, {
    label: 'Overworld 5',
    id: 8,
    dimension: biomeDimension.OVERWORLD
  }]

  const PlayerPermissionLevel = {
    Visitor: 0,
    Member: 1,
    Operator: 2,
    Custom: 3
  }

  const createPreviewRealmFacet = {
    // IDLE: 0, RUNNING: 1, DONE: 2, CANCELLED: 3, FAILED: 4
    createPreviewRealmFromSubscriptionTaskState: 1,
    createPreviewRealmFromSubscriptionId: "0"
  }

  const lastSavedDates = [1709675263000, 1709675330648, 1674514800000, 1716501600000, 1622584800000, 1603231200000, 1706828400000, 1707865200000, 1565733600000, 1640818800000]
  const realmsListFacet = {
    isLoading: false,
    realms: [
      {
        isOwner: true,
        world: {
          id: 0,
          slotName: 'owned-realm-expired',
          realmName: 'My expired Realm',
          ownerName: 'Foo',
          ownerXuid: 'abc123',
          maxPlayers: 10,
          daysLeft: 12,
          expired: true,
          closed: false,
          gameMode: 1,
          isInitialized: true,
          players: [],
          lastSaved: lastSavedDates[0],
          description: ''
        }
      },
      {
        isOwner: false,
        world: {
          id: 1,
          slotName: 'joined-realm-open',
          realmName: 'Steve´s Realm',
          ownerName: 'Batata',
          ownerXuid: 'abc123',
          maxPlayers: 12,
          daysLeft: 12,
          expired: false,
          closed: false,
          gameMode: 0,
          lastSaved: lastSavedDates[1],
          isInitialized: true,
          description: 'A long Realm description that will require folding. Villagers are passive mobs that inhabit villages, work at their professions, breed, and interact with each other. Their outfit varies according to their occupation and biome. A player can trade with them using emeralds as currency. Villagers can climb ladders, but do not recognize them as paths and do not deliberately use them. Any climbing of ladders seems to be a side effect of them being pushed into the block by another mob, (likely, and most often, other villagers). Unfortunately, this behavior can leave them stranded on the second floors and roofs of some village structures, as they lack the necessary AI to intentionally descend ladders A simple fix for these situations is for the player to manually push the villager back toward the ladder hole and then install a wooden trapdoor at the top, after the villager is returned to the ground level.',
          players: [{
            gamerpicLocation: '/foo',
            hasAccepted: true,
            isOnline: true,
            name: 'Alex',
            permission: PlayerPermissionLevel.Member,
            realName: 'Alex Gamer',
            xuid: '1a'
          }, {
            gamerpicLocation: '/foo',
            hasAccepted: true,
            isOnline: true,
            name: 'Steve',
            permission: PlayerPermissionLevel.Operator,
            realName: 'Steve Gamer',
            xuid: '1b'
          }, {
            gamerpicLocation: '/foo',
            hasAccepted: true,
            isOnline: true,
            name: 'Kai',
            permission: PlayerPermissionLevel.Operator,
            realName: 'Kai Gamer',
            xuid: '1c'
          }]
        }
      }
    ]
  }

  function signOut() {
    console.log('[CubeVisage] Sign out click');
  }
  function manage() {
    console.log('[CubeVisage] Manage click');
  }
  function unlink() {
    console.log('[CubeVisage] Unlink click');
  }
  function clearUnlink() {
    console.log('[CubeVisage] Clear unlink click');
  }

  const resourcePacksFacetStatus = {
    Idle: 0,
    CheckingResourcePacks: 1,
    StartDownload: 2,
    DownloadingResourcePacks: 3,
    ActivateDownloadedPack: 4,
    WaitingForPrompt: 5
  }
  const packDownloadStatus = {
    Idle: 0,
    Downloading: 1,
    Importing: 2,
    Completed: 3
  }
  const friendsLoadingState = {
    Unavailable: 0,
    Loading: 1,
    Ready: 2,
    Error: 3
  }
  const platFormLockedPackIds = ['resource-pack-6']
  const packsWithSettings = ['resource-pack-5']
  const createMockPack = packId => {
    return {
      id: packId,
      contentId: packId,
      name: `Mock Pack ${packId}`,
      creator: 'Creator',
      description: `This is a pack description for ${packId}.`,
      size: '3.5MB',
      image: '/hbui/Edit-887593a7c3d9749e237a.png',
      error: undefined,
      isMarketplaceItem: true,
      isPlatformLocked: platFormLockedPackIds.includes(packId),
      hasSettings: packsWithSettings.includes(packId)
    }
  }
  const resourcePacks = {
    globalTexturePacks: [],
    activeTexturePacks: [...new Array(3)].map((_, i) => createMockPack(`${i}`)),
    availableTexturePacks: [...new Array(3)].map((_, i) => createMockPack(`${i + 3}`)),
    realmsTexturePacks: [...new Array(3)].map((_, i) => createMockPack(`${i + 6}`)),
    unownedTexturePacks: [],
    activeBehaviorPacks: [...new Array(3)].map((_, i) => createMockPack(`${i}`)),
    availableBehaviorPacks: [...new Array(3)].map((_, i) => createMockPack(`${i + 3}`)),
    realmsPlusSupported: true,
    realmsSubscriber: true,
    sharedPacks: false,
    resourcePackToDownload: {
      title: '',
      body: ''
    },
    status: resourcePacksFacetStatus.Idle,
    downloadProgress: 0,
    importProgress: 0,
    marketplacePackId: '1',
    lastActivatedPackId: '',
    prompt: {
      actions: [],
      active: false,
      body: '',
      handleAction: () => {},
      id: 'prompt',
      title: ''
    },
    activate: () => {},
    deactivate: () => {},
    cancelDownload: () => false,
    confirmDownload: () => false,
    changePackPriority: () => {},
    showSettings: () => {},
    clearLastActivatedPackId: () => {}
  }
  const worldPackages = {
    loadPacksData: () => {},
    continuePackActivation: () => undefined,
    continuePackDeactivation: () => undefined,
    changePackPriority: () => undefined,
    activatePack: () => undefined,
    deactivatePack: () => undefined,
    downloadPacks: () => {},
    cancelPackDownload: () => {},
    packDownloadError: undefined,
    packDownloadName: '',
    packDownloadStatus: packDownloadStatus.Idle,
    packDownloadProgress: 0,
    packDownloadTaskState: facetTaskState.IDLE,
    worldPacksData: {
      globalTexturePacks: [],
      activeTexturePacks: [...new Array(3)].map((_, i) => createMockPack(`${i}`)),
      availableTexturePacks: [...new Array(3)].map((_, i) => createMockPack(`${i + 3}`)),
      realmsTexturePacks: [...new Array(3)].map((_, i) => createMockPack(`${i + 6}`)),
      unownedTexturePacks: [],
      activeBehaviorPacks: [...new Array(3)].map((_, i) => createMockPack(`${i}`)),
      availableBehaviorPacks: [...new Array(3)].map((_, i) => createMockPack(`${i + 3}`)),
      realmsPlusSupported: true,
      realmsSubscriber: true,
      sharedPacks: false
    },
    isInitialized: true,
    getPackSizes: () => {},
    getPackSizesReset: () => {},
    lastConsultedPackSizesError: undefined,
    lastConsultedPackSizesTaskState: facetTaskState.IDLE,
    lastConsultedPackSizes: ''
  }

  const playerReportFacet = {
    isChatAvailable: () => {
      return true
    },
    decideReportReasonOptions() {
      console.log('[CubeVisage] decideReportReasonOptions()');
    },
    startReport: (xuid, uuid) => {
      console.log(`[CubeVisage] startReport() xuid: ${xuid}, uuid: ${uuid}`);
    },
    finishReport: () => {
      console.log('[CubeVisage] finishReport()');
    },
    reportArea: 0,
    reportReason: 0,
    reportMessage: '',
    xuid: '1000',
    uuid: '',
    selectedChatMessages: [],
    hasReachedReportLimit: false,
    reportableChatMessages: [{
      message: 'Hello there',
      author: 'Steve',
      isAuthorBeingReported: false
    }, {
      message: 'Yo',
      author: 'Alex',
      isAuthorBeingReported: true
    }, {
      message: 'This is a fake message',
      author: 'Steve',
      isAuthorBeingReported: false
    }, {
      message: 'Very nice',
      author: 'Alex',
      isAuthorBeingReported: true
    }, {
      message: 'Test 123',
      author: 'Alex',
      isAuthorBeingReported: true
    }, {
      message: 'Lorem ipsum',
      author: 'Alex',
      isAuthorBeingReported: true
    }, {
      message: 'Hey',
      author: 'Alex',
      isAuthorBeingReported: true
    }, {
      message: 'Howdy',
      author: 'Grubba',
      isAuthorBeingReported: false
    }],
    reportAreaOptions: [{
      label: 'xbox.report.area.chat',
      value: 0
    }, {
      label: 'xbox.report.area.skin',
      value: 1
    }, {
      label: 'xbox.report.area.gameplay',
      value: 2
    }, {
      label: 'xbox.report.area.ingame',
      value: 3
    }, {
      label: 'xbox.report.area.nameOrGamertag',
      value: 4
    }, {
      label: 'xbox.report.area.other',
      value: 5
    }],
    reportReasonOptions: [{
      label: 'wantToReportThem',
      value: 11
    }, {
      label: 'hateSpeech',
      value: 8
    }, {
      label: 'bullying',
      value: 12
    }, {
      label: 'selfHarmOrSuicide',
      value: 13
    }, {
      label: 'sexuallyInappropriate',
      value: 14
    }, {
      label: 'imminentHarm',
      value: 9
    }, {
      label: 'unsportingBehavior',
      value: 4
    }, {
      label: 'cheating',
      value: 1
    }, {
      label: 'impersonation',
      value: 15
    }, {
      label: 'drugsOrAlcohol',
      value: 16
    }, {
      label: 'childSexualExploitationOrAbuse',
      value: 6
    }, {
      label: 'terrorismOrViolentExtremism',
      value: 7
    }, {
      label: 'nonConsensualIntimateImagery',
      value: 10
    }]
  }

  const facets = {
    // vanilla 香草
    'vanilla.buildSettings': {
      isAnyBeta: false,
      isDevBuild: true
    },
    'vanilla.userAccount': {
      hasPremiumNetworkAccess: true,
      isLoggedInWithMicrosoftAccount: true,
      isTrialAccount: false,
      hasValidCrossPlatformSkin: true,
      isBanned: false,
      banReason: '',
      banExpiration: '',
      isRealmsPlusSubscriptionActive: false,
      isMarketplacePassSubscriptionActive: false,
      showPremiumNetworkUpsellModal() {},
      userPermissions: {
        multiplayer: {
          denyReasons: [],
          allowed: true
        },
        addFriends: {
          denyReasons: [],
          allowed: true
        },
        viewProfiles: {
          denyReasons: [],
          allowed: true
        }
      },
      isSignedInPlatformNetwork: true,
      signOutOfMicrosoftAccount: signOut,
      manageMicrosoftAccount: manage,
      unlinkMicrosoftAccount: unlink,
      clearAccountUnlinkState: clearUnlink,
      accountUnlinkState: facetTaskState.IDLE,
      currentXuid: '123'
    },
    'vanilla.screenTechStack': {
      JsonUI: 0,
      OreUI: 1,
      selectTechStackForScreen: function (screen, name) {
        console.log(`[CubeVisage] The ${screen} uses the ${name} technology stack`)
      }
    },
    'vanilla.telemetry': {
      fireEventButtonPressed: function (event) {
        console.log(`[CubeVisage] EventButtonPressed: ${event}`);
      }
    },
    'vanilla.friendsListFacet': {
      loadingState: friendsLoadingState.Ready,
      xblLoadingState: friendsLoadingState.Ready,
      platformLoadingState: friendsLoadingState.Ready,
      xblFriends: [
        mockPlayerEmpty
      ],
      platformFriends: [
        mockPlayerEmpty
      ]
    },
    'vanilla.playerProfile': {
      currentPlayerProfile: {
        data: {
          xuid: "0",
          gamertag: "CurrentPlayer",
          displayName: "current player",
          relation: RelationToCurrentUser.Self,
          gamerScore: 1500,
          reputation: "GoodPlayer",
          avatarUrl: "",
          bio: "description...",
          location: "US",
          tenure: 3
        },
        loaded: true,
        loading: false,
        error: null
      },
      loadedPlayerProfile: {
        data: null,
        loaded: false,
        loading: false,
        error: null
      }
    },
    'vanilla.options': {
      renderDistance: 16,
      defaultRenderDistance: 10
    },
    'vanilla.createNewWorld': createNewWorld,
    'vanilla.worldEditor': worldEditor,
    'vanilla.resourcePacks': resourcePacks,
    'vanilla.worldPackages': worldPackages,
    'vanilla.createPreviewRealmFacet': createPreviewRealmFacet,
    'vanilla.realmsListFacet': realmsListFacet,
    'vanilla.unpairedRealmsListFacet': realmsListFacet,
    'vanilla.debugSettings': {
      flatNether: false,
      enableGameVersionOverride: true,
      gameVersionOverride: '*',
      spawnDimensionId: 0,
      spawnBiomeId: 0,
      biomeOverrideId: 0,
      allBiomes: allBiomes,
      defaultSpawnBiome: false,
      isBiomeOverrideActive: false
    },
    'vanilla.seedTemplates': {
      templates: [
        {
          seedValue: "123456789",
          title: "Test Seed",
          image: "/hbui/assets/world-preview-default-d0210bba13d939ca9e72.jpg",
        },
        {
          seedValue: "1",
          title: "Classic Plant Seed",
          image: "/hbui/assets/preset-ClassicFlat-2d2609c39fd1e95fa49f.jpeg",
        }
      ]
    },
    'vanilla.profanityFilter': {
      isProfanityInString: str => {
        return !!str && str.includes('敏感词');
      }
    },
    'vanilla.clipboard': {
      isClipboardCopySupported: true
    },
    'vanilla.simulationDistanceOptions': {
      simulationDistanceOptions: [4, 6, 8]
    },
    'vanilla.friendworldlist': {
      friendWorlds: [
        {
          ownerId: "1234567890",
          id: "world123",
          friendOfFriendWorld: true
        }
      ],
      xblFriends: [],
      platformFriends: [],
      friendsOfFriends: [],
      xblLoadingState: xblLoadingState.Ready,
      platformLoadingState: xblLoadingState.Ready
    },
    'vanilla.playerProfile': {
      // ProfileError:
      // None: 0 UserNotFound: 1
      currentPlayerProfile: {
        loaded: true,
        data: mockPlayerSelf,
        error: 0
      },
      loadedPlayerProfile: {
        loaded: false,
        data: mockPlayerEmpty,
        error: 0
      },
      loadProfile: function (playerId) {
        console.log('[CubeVisage] Load profile for player id:', playerId);
      },
      playerProfiles: [
        {
          loaded: true,
          data: mockPlayerSelf,
          error: 0
        },
        {
          loaded: false,
          data: mockPlayerEmpty,
          error: 0
        }
      ]
    },
    'vanilla.playerReport': playerReportFacet,
    // core 核心
    'core.splitScreen': {
      numActivePlayers: 1,
      splitScreenDirection: 0,
      splitScreenPosition: 0
    },
    'core.deviceInformation': {
      pixelsPerMillimeter: 3,
      inputMethods: [inputMethods.GAMEPAD_INPUT_METHOD, inputMethods.TOUCH_INPUT_METHOD, inputMethods.MOUSE_INPUT_METHOD],
      isLowMemoryDevice: false,
      isOnline: true,
      guiScaleBase: 0,
      platform: platforms.GOOGLE,
      guiScaleModifier: 0,
      activeMultiplayerServiceIds: [
        "Undefined",
        "XboxLive",
        "Nintendo",
        "AdHoc",
        "Playstation",
        "EDU",
        "Mock"
      ]
    },
    'core.input': {
      currentInputType: inputMethods.MOUSE_INPUT_METHOD,
      swapABButtons: false,
      acceptInputFromAllControllers: false,
      gameControllerId: 0,
      swapXYButtons: false
    },
    'core.safeZone': {
      safeAreaX: 1,
      screenPositionX: 0,
      safeAreaY: 1,
      screenPositionY: 0
    },
    'core.featureFlags': featureFlags,
    'core.sound': sound,
    'core.customScaling': {
      scalingModeOverride: 0,
      fixedGuiScaleModifier: 0
    },
    'core.screenReader': {
      isChatTextToSpeechEnabled: false,
      isIdle: false,
      isUITextToSpeechEnabled: false
    },
    'core.animation': {
      screenAnimationEnabled: true
    },
    'core.router': router,
    'core.social': {},
    'core.user': {},
    'core.locale': {
      locale: "en_US",
      translate: (id) => config?.devServer?.use_translations ? languages[id] || id : id,
      translateWithParameters: (id, params) => config?.devServer?.use_translations 
        ? params.reduce((trans, param, i) => trans.replaceAll(`%${i + 1}$s`, param), languages[id] || id)
        : id,
      formatDate: function (date) {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      formatDateTime: function (date) {
        return new Date(date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      formatNumber: function (number) {
        return new Intl.NumberFormat('en-US').format(number)
      },
      formatCurrency: function (amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(amount)
      },
      getCurrentLocale: function () {
        return this.locale
      },
      getAvailableLocales: function () {
        return ['en_US', 'zh_CN', 'ja_JP', 'ko_KR', 'es_ES', 'fr_FR']
      },
      setLocale: function (newLocale) {
        if (this.getAvailableLocales().includes(newLocale)) {
          this.locale = newLocale
          console.log(`[CubeVisage] Locale changed to: ${newLocale}`)
        } else {
          console.warn(`[CubeVisage] Locale not supported: ${newLocale}`)
        }
      },
      getHowLongAgoAsString: function(timestamp) {
        const now = Date.now()
        const diff = now - timestamp
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        
        if (days > 0) return days === 1 ? '1 day ago' : `${days} days ago`
        if (hours > 0) return hours === 1 ? '1 hour ago' : `${hours} hours ago`
        if (minutes > 0) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
        return seconds <= 1 ? 'just now' : `${seconds} seconds ago`
      }
    }
  }
  
  return {
    on: function(event, callback) {
      console.log('[CubeVisage] Register event:', event, callback)
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, [])
      }
      eventHandlers.get(event).push(callback)
    },
    
    off: function(event, callback) {
      console.log('[CubeVisage] Unregister event:', event, callback)
      if (eventHandlers.has(event)) {
        const handlers = eventHandlers.get(event)
        const index = handlers.indexOf(callback)
        if (index > -1) {
          handlers.splice(index, 1)
        }
        if (handlers.length === 0) {
          eventHandlers.delete(event)
        }
      }
    },
    
    trigger: function(event, ...args) {
      console.log('[CubeVisage] Trigger event:', event, args)
      
      if (event === 'facet:request' || event === 'query:subscribe/vanilla.menus.settingsGroupQuery') {
        const [updateEvent, errorEvent, options] = args
        
        if (event.endsWith('vanilla.menus.settingsGroupQuery')) {
          console.log(`[CubeVisage] Handling ${errorEvent} vanilla.menus.settingsGroupQuery facet request`)
          const handlers = eventHandlers.get(`query:updated/${updateEvent}`)
          handlers.forEach(handler => {
            try {
              handler(settings[errorEvent])
            } catch (error) {
              console.error('[CubeVisage] Error in facet update handler:', error)
            }
          })
          return
        }
        
        if (facets[updateEvent] || facets[errorEvent]) {
          console.log(`[CubeVisage] Handling ${updateEvent} facet request`)
          
          const facetData = facets[updateEvent] || facets[errorEvent]
          
          if (eventHandlers.has(`facet:updated:${updateEvent}`)) {
            const handlers = eventHandlers.get(`facet:updated:${updateEvent}`)
            handlers.forEach(handler => {
              try {
                handler(facetData)
              } catch (error) {
                console.error('[CubeVisage] Error in facet update handler:', error)
              }
            })
          }
          
          return
        }
        
        if (updateEvent && eventHandlers.has(`facet:updated:${updateEvent}`)) {
          const handlers = eventHandlers.get(`facet:updated:${updateEvent}`)
          handlers.forEach(handler => {
            try {
              handler(options?.data)
            } catch (error) {
              console.error('[CubeVisage] Error in update handler:', error)
            }
          })
        }
        
        if (errorEvent && eventHandlers.has(`facet:error:${errorEvent}`)) {
          const handlers = eventHandlers.get(`facet:error:${errorEvent}`)
          handlers.forEach(handler => {
            try {
              handler(options?.error)
            } catch (error) {
              console.error('[CubeVisage] Error in error handler:', error)
            }
          })
        }
        
        return
      }
      
      if (eventHandlers.has(event)) {
        const handlers = eventHandlers.get(event)
        handlers.forEach(handler => {
          try {
            handler(...args)
          } catch (error) {
            console.error('[CubeVisage] Error in event handler:', error)
          }
        })
      }
    },
    
    _getFacetData: function(facetName) {
      return facets[facetName]
    },
    
    _getRouter: function() {
      return router
    },
    
    _addFacet: function(facetName, data) {
      facets[facetName] = data
    },
    
    _addTranslation: function(key, value) {
      languages[key] = value
    },
    
    _setUseTranslations: value => config?.devServer && (config.devServer.use_translations = value)
  }
})()