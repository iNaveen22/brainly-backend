export function random(len: number){
    let options = "qwertpoiuyasdfglkjhzxcvmnb123456789"
    let ans = "";
    for(let i=0; i<len; i++){
        ans += options[(Math.floor(Math.random() * 35))]
    }
    return ans;
}