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
  default: { expoConfig: { version: '1.0.0' } },
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    remove: jest.fn(),
  })),
  setAudioModeAsync: jest.fn(async () => {}),
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
