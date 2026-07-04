// ================================================================
//  RSI INVENTORY — api.js
//  Uses POST with Content-Type: text/plain.
//  This avoids CORS preflight entirely — the browser treats this
//  as a "simple request" and does not need permission headers
//  from Apps Script, which never sends Access-Control-Allow-Origin.
//  This is the officially recommended pattern for Apps Script.
// ================================================================

var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwEGyfT1J4btGoY2sH8nFYg2JLagudbSokMNB2Cb7T9zVi51znBKR1J5lBEI0iYk8XScw/exec';

function _call(payload) {
  return fetch(SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(function (r) { return r.json(); })
  .catch(function (e) {
    console.error('Sheets error:', e.message);
    return null;
  });
}

function _id() {
  return 'rsi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

// ================================================================
//  AUTH
// ================================================================

function doSignup(name, email, password) {
  return _call({
    action: 'addUser', id: _id(),
    name: name, email: email,
    password: password, createdAt: Date.now()
  }).then(function (res) {
    if (!res) return { success: false, message: 'Could not reach the server. Check your internet connection.' };
    if (!res.ok) {
      if (res.error === 'EMAIL_EXISTS') return { success: false, message: 'An account with this email already exists.' };
      return { success: false, message: res.error || 'Signup failed. Please try again.' };
    }
    return { success: true, user: { id: _id(), name: name, email: email } };
  });
}

function doLogin(email, password) {
  return _call({ action: 'getUsers' }).then(function (res) {
    if (!res) return { success: false, message: 'Could not reach the server. Check your internet connection.' };
    if (!res.ok) return { success: false, message: 'Login error. Please try again.' };
    var found = null;
    (res.users || []).forEach(function (u) {
      if (u.email.toLowerCase() === email.toLowerCase() && u.password === password) found = u;
    });
    if (found) return { success: true, user: { id: found.id, name: found.name, email: found.email } };
    return { success: false, message: 'Incorrect email or password.' };
  });
}

// ================================================================
//  ITEMS
// ================================================================

function doAddItem(data) {
  var item = {
    id:          _id(),
    name:        data.name        || '',
    location:    data.location    || '',
    quantity:    Number(data.quantity)  || 0,
    threshold:   Number(data.threshold) || 0,
    description: data.description || '',
    photoUrl:    data.photoUrl    || '',
    addedAt:     Date.now(),
    editedAt:    null
  };
  return _call({ action: 'addItem', item: item }).then(function (res) {
    if (!res || !res.ok) return { success: false, message: 'Could not save item to server.' };
    return { success: true, item: item };
  });
}

function doGetItems() {
  return _call({ action: 'getItems' }).then(function (res) {
    if (!res) return { success: false, message: 'Could not load items. Check your internet connection.', items: [] };
    if (!res.ok) return { success: false, message: 'Server error loading items.', items: [] };
    return { success: true, items: res.items || [] };
  });
}

function doUpdateItem(id, data) {
  var item = {
    id: id,
    name:        data.name        || '',
    location:    data.location    || '',
    quantity:    Number(data.quantity)  || 0,
    threshold:   Number(data.threshold) || 0,
    description: data.description || '',
    photoUrl:    data.photoUrl    || '',
    editedAt:    Date.now()
  };
  return _call({ action: 'updateItem', item: item }).then(function (res) {
    if (!res || !res.ok) return { success: false, message: 'Could not update item on server.' };
    return { success: true, item: item };
  });
}

function doDeleteItem(id) {
  return _call({ action: 'deleteItem', id: id }).then(function (res) {
    if (!res || !res.ok) return { success: false, message: 'Could not delete item on server.' };
    return { success: true };
  });
}
