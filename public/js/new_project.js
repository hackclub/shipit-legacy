var authors = document.getElementById('authors');
var addAuthorBtn = document.getElementById('add_author_btn');
var authorCount = 1;
var authorPlaceholders = [
  'Marvin the Paranoid Android',
  'Ford Prefect',
  'Trillian',
  'Arthur Dent',
  'Slartibartfast'
]

addAuthorBtn.onclick = function () {
  var br = document.createElement('br');
  var input = document.createElement('input');

  input.setAttribute('id', 'authors['+authorCount+']');
  input.setAttribute('type', 'text');
  input.setAttribute('name', 'authors['+authorCount+']');
  input.setAttribute('placeholder', getRandomElementIn(authorPlaceholders));

  authors.appendChild(br);
  authors.appendChild(input);

  authorCount++;
};

function getRandomElementIn(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}
