const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Query {
  constructor(data, modelName, db) {
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone
    this.modelName = modelName;
    this.db = db;
  }

  populate(pathStr) {
    if (!this.data) return this;

    const populateSingle = (item) => {
      if (pathStr === 'sender' && item.sender) {
        const senderId = typeof item.sender === 'object' ? item.sender._id : item.sender;
        const users = this.db.readData('users');
        const user = users.find(u => u._id === senderId.toString());
        if (user) {
          const { password, ...safeUser } = user;
          item.sender = safeUser;
        }
      }
      return item;
    };

    if (Array.isArray(this.data)) {
      this.data = this.data.map(populateSingle);
    } else {
      this.data = populateSingle(this.data);
    }

    return this;
  }

  then(onFulfilled, onRejected) {
    return Promise.resolve(this.data).then(onFulfilled, onRejected);
  }
}

class FallbackModel {
  constructor(filename, db) {
    this.filename = filename;
    this.db = db;
  }

  read() {
    return this.db.readData(this.filename);
  }

  write(data) {
    this.db.writeData(this.filename, data);
  }

  find(filter = {}) {
    const items = this.read();
    const filtered = items.filter(item => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    return new Query(filtered, this.filename, this.db);
  }

  findOne(filter = {}) {
    const items = this.read();
    const found = items.find(item => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    return new Query(found || null, this.filename, this.db);
  }

  findById(id) {
    if (!id) return new Query(null, this.filename, this.db);
    const items = this.read();
    const found = items.find(item => item._id === id.toString());
    return new Query(found || null, this.filename, this.db);
  }

  async create(data) {
    const items = this.read();
    const newItem = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ...data,
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    this.write(items);
    return newItem;
  }
}

class FallbackDB {
  constructor() {
    this.models = {
      User: new FallbackModel('users', this),
      Channel: new FallbackModel('channels', this),
      Message: new FallbackModel('messages', this)
    };
  }

  readData(filename) {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error reading ${filename}.json, resetting:`, e);
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
  }

  writeData(filename, data) {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  getModel(name) {
    return this.models[name];
  }
}

const fallbackDBInstance = new FallbackDB();

module.exports = {
  UserFallback: fallbackDBInstance.getModel('User'),
  ChannelFallback: fallbackDBInstance.getModel('Channel'),
  MessageFallback: fallbackDBInstance.getModel('Message')
};
