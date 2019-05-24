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
      case "en": { target = translations[0]; } break;
      case "ro": { target = translations[1]; } break;
      case "ru": { target = translations[2]; } break;
    }
    return target;
  },
  parseDate: function (value) {
    let a = new Date(value);
    let hours = a.getHours();
    let minutes = a.getMinutes();
    let ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    let month = a.getMonth()<10?"0"+(a.getMonth()+1):a.getMonth()+1;

    return a.getDate() + "." + ++month + "." + a.getFullYear() + ", " + hours + ":" + minutes + " " + ampm;

  },
  getDateDate: function(value){
    let a = new Date(value);
    date = a.getDate();

    return date>9?date:"0"+date;
  },
  getDateMonth: function(value){
    let a = new Date(value);
    let months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC"
    ];
    return months[a.getMonth()];
    
  }
}