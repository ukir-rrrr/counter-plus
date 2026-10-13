// Jest セットアップファイル
// React Native のモックやグローバル設定を追加する場所

// expo-crypto の randomUUID をモック
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).slice(2, 9)),
}));

// expo-haptics をモック
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// expo-sqlite をモック
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(() => null),
    runSync: jest.fn(),
    execSync: jest.fn(),
    transaction: jest.fn((callback) =>
      callback({
        executeSql: jest.fn(),
      })
    ),
  })),
}));

jest.mock('expo-file-system', () => ({
  File: class File {
    uri = 'file:///mock/cache/file.csv';
    create() {}
    write() {}
  },
  Paths: { cache: 'file:///mock/cache' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(async () => true),
  canOpenURL: jest.fn(async () => true),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(async () => ({ type: 'dismiss' })),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.0.0' },
    executionEnvironment: 'bare',
    appOwnership: null,
  },
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({
    canGoBack: () => true,
    goBack: jest.fn(),
    addListener: () => () => {},
  }),
  useFocusEffect: (cb) => {
    const React = require('react');
    React.useEffect(cb, [cb]);
  },
  usePathname: () => '/',
  useSegments: () => [],
}));

jest.mock('expo-dev-client', () => ({
  setToolsButtonVisible: jest.fn(),
}));

jest.mock('expo-modules-core', () => {
  const actual = jest.requireActual('expo-modules-core');
  return {
    ...actual,
    requireOptionalNativeModule: jest.fn((name) =>
      typeof actual.requireOptionalNativeModule === 'function'
        ? actual.requireOptionalNativeModule(name)
        : null,
    ),
  };
});

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG', VERBOSE: 'VERBOSE', INFO: 'INFO' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
}));

// drizzle-orm/expo-sqlite をモック
jest.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: jest.fn(() => ({
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => []),
          get: jest.fn(() => null),
        })),
        orderBy: jest.fn(() => []),
        get: jest.fn(() => null),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        run: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({
        run: jest.fn(),
      })),
    })),
    transaction: jest.fn((callback) =>
      callback({
        select: jest.fn(() => ({
          from: jest.fn(() => ({
            where: jest.fn(() => ({
              get: jest.fn(() => ({ total: 0, value: 0 })),
            })),
            get: jest.fn(() => ({ total: 0 })),
          })),
        })),
        insert: jest.fn(() => ({
          values: jest.fn(() => ({
            run: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          set: jest.fn(() => ({
            where: jest.fn(() => ({
              run: jest.fn(),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          where: jest.fn(() => ({
            run: jest.fn(),
          })),
        })),
      })
    ),
  })),
}));
