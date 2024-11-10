import { database, paths } from './db.js';
import { makeTypes } from 'flyweight-client';

await makeTypes(database, paths);
