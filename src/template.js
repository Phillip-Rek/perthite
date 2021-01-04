let template = ``
settings = {"x-powered-by":true,"etag":"weak","env":"development","query parser":"extended","subdomain offset":2,"trust proxy":false,"views":"views","jsonp callback name":"callback","view engine":"html"};
user = `User-1`;
users = [{"name":"User-1","lastname":"Last-N-1"},{"name":"User-2","lastname":"Last-N-2"}];
complex = [[1,2],[6,7],[8,9]];
concat = (param = "", param2 = "") => {
            return param + param2;
        };
isString = (arg) => typeof arg === "string";
_locals = {};
cache = false;
if(user === user){
template += `<div`;
template += ` class="A"`;
template += ` name=\"`;
template += users[0].name;
template += '"';
template += ">";
template += ` `;
template += ` `;
template += ` `;
template += ` `;
template += `    `;
template += `<input`;
template += ` type="text"`;
template += ` value=\"`;
template += users[0].name;
template += '"';
template += ` onkeypress="console.log(988889898)"`;
template += "/>";
if(users === users){
template += `<div`;
template +=`>`
for(let user of users){
template += ` `;
template += ` `;
template += `        `;
template += `<h1`;
template += ">";
template += `content `;
template += user.name;
template += `</h1>`;
}
template += `</div>`;
}
template += `<div`;
template +=`>`
for(let us of users){
template += ` `;
template += `        `;
template += `<h1`;
template += ">";
template += us.name;
template += `</h1>`;
}
template += `</div>`;
template += `</div>`;
}
else if(user === user ){
template += `<h2`;
template += ">";
template += ` `;
template += `test 1 :--- `;
template += users[0].name;
template += `</h2>`;
}
template += `<ul`;
template +=`>`
for(let c of [1, 2, 3, 4, 6, 7]){
template += ` `;
template += `    `;
template += `<li`;
template += ">";
template += ` `;
template += concat(c, " -- HELLO WORLD");
template += `</li>`;
}
template += `</ul>`;
if( typeof "User-1" === typeof "User-12" ){
template += `<div`;
template += ">";
template += ` `;
template += `LAST IF BLOCK`;
template += `</div>`;
}
else if("User-1" === "User-18" && 2 === 23 || 1 === 1 && false ){
template += `<div`;
template += ">";
template += ` `;
template += `LAST ELSE IF BLOCK 2`;
template += `</div>`;
}
else{
template += `<div`;
template += ">";
template += ` `;
template += `LAST ELSE BLOCK`;
template += `</div>`;
}
template += `
<script>
    let msg = "hello world"
</script>`;
