import pb from './pb'


export async function createRoom(code) {
return await pb.collection('rooms').create({
code,
started: false
})
}


export async function getRoom(id) {
return await pb.collection('rooms').getOne(id)
}


export async function tryToGetRoom(code) {
const rooms = await pb.collection('rooms').getFullList({
filter: `code = "${code}"`
})
return rooms[0] || null
}