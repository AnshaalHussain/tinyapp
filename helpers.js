const findUserByEmail = function(email, users) {
  for(let userId in users) {
    const user = users[userId];
    if(email === user.email) {
      return user;
    }
  }
  return false;
}

module.exports = { findUserByEmail };