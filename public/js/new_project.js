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

function getRandomElementIn(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

addAuthorBtn.onclick = function () {
  var authorDiv = document.createElement('div');
  var inputWrapper = document.createElement('span');
  var input = document.createElement('input');
  var removeWrapper = document.createElement('span');
  var removeBtn = document.createElement('a');

  authorDiv.setAttribute('class', 'author');

  inputWrapper.setAttribute('class', 'inputWrapper');

  input.setAttribute('id', 'authors['+authorCount+']');
  input.setAttribute('type', 'text');
  input.setAttribute('name', 'authors['+authorCount+']');
  input.setAttribute('placeholder', getRandomElementIn(authorPlaceholders));

  removeWrapper.setAttribute('class', 'removeWrapper');

  removeBtn.setAttribute('class', 'remove-btn')
  removeBtn.setAttribute('onclick', 'removeAuthorBtn(this)');
  removeBtn.setAttribute('href', '#');
  removeBtn.innerHTML = '[-]';

  inputWrapper.appendChild(input);
  removeWrapper.appendChild(removeBtn);

  authorDiv.appendChild(inputWrapper);
  authorDiv.appendChild(removeWrapper);

  authors.appendChild(authorDiv);

  authorCount++;
};

function removeAuthorBtn(btn) {
  // Remove the parent's parent of the btn
  var authorDivParent = btn.parentNode.parentNode.parentNode;
  var authorDiv = btn.parentNode.parentNode;
  return authorDivParent.removeChild(authorDiv);
}
