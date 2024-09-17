import { Queue } from "../src/queue.js";
import { Request } from "../src/request.js";


let Q = new Queue('queue')

Q.display('initial')
console.assert(Q.size() ==0)

let ro = new Request(20, 'T1')
Q.insert(ro)
Q.display('insert 20')
console.assert(Q.size() ==1)

ro = new Request(30, 'T1')
Q.insert(ro)
Q.display('insert 30')

console.log('look returns ', Q.look().timestamp)
console.log('remove returns ', Q.remove().timestamp)
Q.display('removed first')

ro = new Request(20, 'T1')
Q.insert(ro)
Q.display('re-insert 20')
console.assert(Q.size() ==2)

console.log('look returns ', Q.look().timestamp)
console.log('remove returns ', Q.remove().timestamp)
Q.display('removed first')

console.log('look returns ', Q.look().timestamp)
console.log('remove returns ', Q.remove().timestamp)
Q.display('removed first')


console.log('look returns ', Q.look())  // should be null
try {
    console.log('remove returns ', Q.remove().timestamp) // error here
}catch{
    console.log('tried to remove from empty Q and got error')
}


ro = new Request(20, 'T1')
Q.insert(ro)
Q.display('re-insert 20')
console.assert(Q.size() ==1)

console.log(Q.filter((item:Request)=>item.timestamp==20))
console.log(Q.filter((item:Request)=>item.timestamp==30))
console.assert(Q.filter((item:Request)=>item.timestamp==20).length == 1)
console.assert(Q.filter((item:Request)=>item.timestamp==30).length == 0)
