class ChuckNorris {
  static getJoke() {
    return fetch("https://api.chucknorris.io/jokes/random")
      .then((res) => res.json())
      .then((jsonData) => {
        const joke = jsonData.value;
        return joke;
      });
  }
}
//console.log(ChuckNorris.getJoke());
module.exports = ChuckNorris;
