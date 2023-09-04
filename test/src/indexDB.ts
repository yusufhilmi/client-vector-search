////////////////////////////////////////////////////////////////////////////////////
// 1. BASIC RUN

// import "fake-indexeddb/auto";

// let db: IDBDatabase;

// const request = indexedDB.open("MyTestDatabase");
// request.onerror = (err) => {
//     console.error(`IndexedDB error: ${request.error}`, err);
//     throw err;
// }
// request.onupgradeneeded = () => {
//     // no database to upgrade
//     db = request.result
//     console.log("IndexedDB success")
//     const values = [
//         {name: "Apple", embedding: [1,2,3]},
//         {name: "Banana", embedding: [4,5,6]},
//         {name: "Cheddar", embedding: [7,8,9]}
//     ];

//     // const objectStore = db.createObjectStore("fruits", { keyPath: "id" });
//     const objectStore = db.createObjectStore("fruits", { autoIncrement: true });

//     objectStore.createIndex("name", "name", { unique: false });

//     objectStore.transaction.oncomplete = (event) => {
//         const fruitsObjectStore = db.transaction("fruits", "readwrite").objectStore("fruits");
//         values.forEach((value) => {
//             console.log(value)
//             fruitsObjectStore.add(value);
//         });
//     };    
// }

// request.onsuccess = (event: any) => {
//     var db = event.target.result;
//     console.log("IndexedDB success")
//     var tx = db.transaction("fruits", "readwrite");
//     tx.objectStore("fruits").index("name").get("Banana").addEventListener("success", function (event: any) {
//         console.log("From index:", event.target.result);
//     });
//     db.close();
// }


/*
asdc
functionality to add
- create a new DB and give it a name
MVP:
- add functionality to select a DB and save them. which function exactly would this go to?
- add functionality to select a DB and delete all of them. which function exactly would this go to?
- how to implement search functionality
*/


////////////////////////////////////////////////////////////////////////////////////
///2.  DYNAMIC DB
// import { DynamicDB } from 'client-vector-search'

// const dbHandler = new DynamicDB();
// try {
//     await dbHandler.initializeDB("TestDB");
//     console.log("Database 'TestDB' initialized successfully");
// } catch (error) {
//     console.error("Error initializing 'TestDB' database:", error);
// }

// // Test creating an object store
// try {
//     //   await dbHandler.makeObjectStore("by_name", "name");
//     await dbHandler.makeObjectStore("TestStore")
//     console.log("'TestStore' object store created successfully");
// } catch (error) {
//     console.error("Error creating 'TestStore' object store:", error);
// }

// // // Test adding to the database
// try {
//     await dbHandler.addToDB("TestStore", { name: "Test1", value: "123" });
//     console.log("Data '{ name: \"Test1\", value: \"123\" }' added to 'TestStore' successfully");
// } catch (error) {
//     console.error("Error adding data to 'TestStore':", error);
// }

// try {
//     await dbHandler.makeObjectStore("TestStore2")
//     await dbHandler.addToDB("TestStore2", { name: "Test2", value: "456" });
//     console.log("Data '{ name: \"Test2\", value: \"456\" }' added to 'TestStore2' successfully");
// } catch (error) {
//     console.error("Error adding data to 'TestStore2':", error);
// }

// // show all objects in the database
// try {

//     const objects = await dbHandler.getAllFromDB("TestStore");
//     console.log("Objects in 'TestStore' database:", objects);

//     const objects2 = await dbHandler.getAllFromDB("TestStore2");
//     console.log("Objects in 'TestStore2' database:", objects2);
// }
// catch (error) {
//     console.error("Error getting objects from database:", error);
// }


////////////////////////////////////////////////////////////////////////////////////
// 3. EMBEDDING INDEX
import { EmbeddingIndex } from 'client-vector-search'
console.log("\n\nTesting EmbeddingIndex class...");


const initialObjects = [
  { id: 1, name: "Apple", embedding: [1, 2, 3] },
  { id: 2, name: "Banana", embedding: [4, 5, 6] },
];
const index = new EmbeddingIndex(initialObjects);
await index.saveIndexToDB();




