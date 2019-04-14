module.exports = {
  ifeq: function (a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  lang: function (value, res) {
    return res.__(value);
  },
  langSpec: function (value, lang, res) {
    let translations = res.__l(value);
    let target = "";

    switch (lang) {
      case "en": target = translations[0]; break;
      case "ro": target = translations[1]; break;
      case "ru": target = translations[2]; break;
    }
    return target
  },
  parseDate: function (value) {
    let a = new Date(value);
    let hours = a.getHours();
    let minutes = a.getMinutes();
    let ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return a.getDate() + "." + a.getMonth() + "." + a.getFullYear() + ", " + hours + ":" + minutes + " " + ampm;

  }
}