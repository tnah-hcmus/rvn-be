const createUUID = () => {
  let guid = "xyx-4xxx-yxxx-xx".replace(/[xy]/g, (c) => {
    let r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return guid;
};
module.exports = createUUID;
