const ZongJi = require('@powersync/mysql-zongji');
const dbConfig = require('./db').client.config.connection;

let zongji;

function initBinlogListener(io) {
  zongji = new ZongJi({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows'],
    includeSchema: {
      [dbConfig.database]: ['users', 'orders', 'products'],
    },
  });

  zongji.on('binlog', (event) => {
    const eventType = event.getEventName();
    const tableInfo = event.tableMap?.[event.tableId];
    if (!['writerows', 'updaterows', 'deleterows'].includes(eventType)) return;
    if (!tableInfo) return;

    const table = tableInfo.tableName;
    const rows = Array.isArray(event.rows) ? event.rows : event.rows ? [event.rows] : [];

    switch (eventType) {
      case 'writerows':
        handleInsert(io, table, rows);
        break;
      case 'updaterows':
        handleUpdate(io, table, rows);
        break;
      case 'deleterows':
        handleDelete(io, table, rows);
        break;
    }
  });

  zongji.on('error', (err) => console.error('❌ ZongJi error:', err));

  zongji.start({ startAtEnd: true });
  console.log('✅ Binary log listener started for tables:', ['users', 'orders', 'products']);
}

function handleInsert(io, table, rows) {
  rows.forEach((row) => {
    io.emit('database-change', {
      type: 'INSERT',
      table,
      userId: row.id,
      data: {
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
      },
      timestamp: new Date().toISOString(),
    });
  });
}

function handleUpdate(io, table, rows) {
  rows.forEach((row) => {
    const oldData = row.before || {};
    const newData = row.after || {};
    io.emit('database-change', {
      type: 'UPDATE',
      table,
      userId: newData.id,
      data: {
        id: newData.id,
        name: newData.name,
        email: newData.email,
        status: newData.status,
        old_name: oldData.name,
        old_email: oldData.email,
        old_status: oldData.status,
      },
      timestamp: new Date().toISOString(),
    });
  });
}

function handleDelete(io, table, rows) {
  rows.forEach((row) => {
    io.emit('database-change', {
      type: 'DELETE',
      table,
      userId: row.id,
      data: {
        id: row.id,
        name: row.name,
        email: row.email,
      },
      timestamp: new Date().toISOString(),
    });
  });
}

module.exports = { initBinlogListener };
