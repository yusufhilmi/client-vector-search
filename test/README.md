# execute test files

## test runs
```npm run perf```
```npm run test```

## Cache files
```cd test```

```npx ts-node --esm src/cache.ts```

## IndexedDB

### test script

1. uncomment fake DB linesin the `src/index.ts` library
2. run `npx ts-node --esm src/indexDB.ts`

### test interface

1. go to `src/indexed-db-front` and run the npm script ```npm run start```
2. go the local host and test it out
