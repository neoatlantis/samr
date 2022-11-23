module.exports = (fn, time = 1000) => {
  try {                                 /* [1] */
    if (fn()) {
      return Promise.resolve(true);
    } else {
      return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
          try {                         /* [2] */
            if (fn()) {
              clearInterval(timer);
              resolve(true);
            }
          } catch (e) {                 /* [3] */
            clearInterval(timer);       /* [4] */
            reject(e);                  /* [5] */
          }
        }, time);
      });
    }
  } catch (e) {                         /* [6] */
    return Promise.reject(e);           /* [7] */
  }
};
