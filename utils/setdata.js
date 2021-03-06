export default function setdata(to,origin) {
    Object.keys(to).forEach(key=>{
        let keylist = Object.keys(origin)
        if(keylist.includes(key)){
            to[key] = origin[key]
        }

    })
}