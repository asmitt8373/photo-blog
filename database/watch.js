import { database, paths } from './db.js';
import { watch } from 'flyweight-client';

watch(database, paths);
