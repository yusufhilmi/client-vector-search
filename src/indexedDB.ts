// uncomment for testing only
// import { IDBFactory } from "fake-indexeddb";
// const indexedDB = new IDBFactory();

export class IndexedDbManager {
  private DBname!: string;
  private objectStoreName!: string;

  constructor(DBname: string, objectStoreName: string) {
    this.DBname = DBname;
    this.objectStoreName = objectStoreName;
  }

  static async create(
    DBname: string = 'defaultDB',
    objectStoreName: string = 'DefaultStore',
    index: string | null = null,
  ): Promise<IndexedDbManager> {
    const instance = new IndexedDbManager(DBname, objectStoreName);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DBname);
      let db: IDBDatabase;

      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject(new Error('Database initialization failed'));
      };

      request.onsuccess = async () => {
        db = request.result;
        if (!db.objectStoreNames.contains(objectStoreName)) {
          db.close();
          await instance.createObjectStore(index);
        }
        db.close();
        resolve(instance);
      };
    });
  }

  async createObjectStore(index: string | null = null): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DBname);
      request.onsuccess = () => {
        let db1 = request.result;
        var version = db1.version;
        db1.close();
        const request_2 = indexedDB.open(this.DBname, version + 1);
        request_2.onupgradeneeded = async () => {
          let db2 = request_2.result;
          if (!db2.objectStoreNames.contains(this.objectStoreName)) {
            const objectStore = db2.createObjectStore(this.objectStoreName, {
              autoIncrement: true,
            });
            if (index) {
              objectStore.createIndex(`by_${index}`, index, { unique: false });
            }
          }
        };
        request_2.onsuccess = async () => {
          let db2 = request_2.result;
          console.log('Object store creation successful');
          db2.close();
          resolve();
        };
        request_2.onerror = (event) => {
          console.error('Error creating object store:', event);
          reject(new Error('Error creating object store'));
        };
      };
      request.onerror = (event) => {
        console.error('Error opening database:', event);
        reject(new Error('Error opening database'));
      };
    });
  }

  async addToDB(
    objs: { [key: string]: any }[] | { [key: string]: any },
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const request = indexedDB.open(this.DBname);

      request.onsuccess = async () => {
        let db = request.result;
        const transaction = db.transaction([this.objectStoreName], 'readwrite');
        const objectStore = transaction.objectStore(this.objectStoreName);

        if (!Array.isArray(objs)) {
          objs = [objs];
        }

        objs.forEach((obj: { [key: string]: any }) => {
          const request = objectStore.add(obj);

          request.onerror = (event) => {
            console.error('Failed to add object', event);
            throw new Error('Failed to add object');
          };
        });

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = (event) => {
          console.error('Failed to add object', event);
          reject(new Error('Failed to add object'));
        };
        db.close();
      };
    });
  }

  async *dbGenerator(): AsyncGenerator<any, void, undefined> {
    const objectStoreName = this.objectStoreName;
    const dbOpenPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.DBname);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(new Error('Could not open DB'));
      };
    });

    try {
      const db = await dbOpenPromise;
      const transaction = db.transaction([objectStoreName], 'readonly');
      const objectStore = transaction.objectStore(objectStoreName);
      const request = objectStore.openCursor();

      let promiseResolver: (value: any) => void;

      request.onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          promiseResolver(cursor.value);
          cursor.continue();
        } else {
          promiseResolver(null);
        }
      };

      while (true) {
        const promise = new Promise<any>((resolve) => {
          promiseResolver = resolve;
        });
        const value = await promise;
        if (value === null) break;
        yield value;
      }

      db.close();
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
  async deleteObjectStoreFromDB(
    DBname: string,
    objectStoreName: string,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const request = indexedDB.open(this.DBname);

      request.onsuccess = async () => {
        let db = request.result;
        var version = db.version;
        db.close();
        const request_2 = indexedDB.open(db.name, version + 1);
        request_2.onupgradeneeded = async () => {
          let db2 = request_2.result;
          if (db2.objectStoreNames.contains(objectStoreName)) {
            db2.deleteObjectStore(objectStoreName);
          } else {
            console.error(
              `Object store '${objectStoreName}' not found in database '${DBname}'`,
            );
            reject(
              new Error(
                `Object store '${objectStoreName}' not found in database '${DBname}'`,
              ),
            );
          }
        };
        request_2.onsuccess = () => {
          let db2 = request_2.result;
          console.log('Object store deletion successful');
          db2.close();
          resolve();
        };
        request_2.onerror = (event) => {
          console.error('Failed to delete object store', event);
          let db2 = request_2.result;
          db2.close();
          reject(new Error('Failed to delete object store'));
        };
      };
      request.onerror = (event) => {
        console.error('Failed to open database', event);
        reject(new Error('Failed to open database'));
      };
    });
  }
}
