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
var clubs = document.getElementById('clubs');
var addClubBtn = document.getElementById('add_club_btn');
var clubCount = 1;

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

addClubBtn.onclick = function () {
  var clubDiv = document.createElement('div');
  var selectWrapper = document.createElement('span');
  var select = document.createElement('select');
  var removeWrapper = document.createElement('span');
  var removeBtn = document.createElement('a');

  clubDiv.setAttribute('class', 'club');

  selectWrapper.setAttribute('class', 'selectWrapper');

  select.setAttribute('id', 'club['+clubCount+']');
  select.setAttribute('name', 'clubs['+clubCount+']');
  select.innerHTML = document.getElementById('clubs[0]').innerHTML;

  removeWrapper.setAttribute('class', 'removeWrapper');

  removeBtn.setAttribute('class', 'remove-btn')
  removeBtn.setAttribute('onclick', 'removeClubBtn(this)');
  removeBtn.setAttribute('href', '#');
  removeBtn.innerHTML = '[-]';

  selectWrapper.appendChild(select);
  removeWrapper.appendChild(removeBtn);

  clubDiv.appendChild(selectWrapper);
  clubDiv.appendChild(removeWrapper);

  clubs.appendChild(clubDiv);

  clubCount++;
};

function removeClubBtn(btn) {
  // Remove the parent's parent of the btn
  var clubDivParent = btn.parentNode.parentNode.parentNode;
  var clubDiv = btn.parentNode.parentNode;
  return clubDivParent.removeChild(clubDiv);
}
