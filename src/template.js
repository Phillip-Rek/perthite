let template = ``
let user = `User-1`;
let users = [{"name":"User-1","lastname":"Last-N-1"},{"name":"User-2","lastname":"Last-N-2"}];
let complex = [[1,2],[6,7],[8,9]];
let concat = (param = "", param2 = "") => {
        return param + param2;
    };
let isString = (arg) => typeof arg === "string";
template += `<div`;
template +=`>`
users.forEach((user, i)=>{
template += ` `;
template += `    `;
template += `<h1`;
template += ">";
template += ` `;
template += `i +1 `;
template += `</h1>`;

})
template += `</div>`;
