migrate((db) => {
  const dao = new Dao(db)

  // --- Collection Rooms ---
  const rooms = new Collection({
    name: "rooms",
    type: "base",
    system: false,
    schema: [
      {
        name: "code",
        type: "text",
        required: true,
        unique: true,
        options: {
          min: 3,
          max: 20,
          pattern: ""
        }
      },
      {
        name: "started",
        type: "bool",
        required: false,
        options: {}
      },
      {
        name: "host_id",
        type: "relation",
        required: false,
        options: {
          collectionId: null,
          cascadeDelete: false
        }
      }
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  })

  dao.saveCollection(rooms)

  // --- Collection Players ---
  const players = new Collection({
    name: "players",
    type: "base",
    system: false,
    schema: [
      {
        name: "name",
        type: "text",
        required: true,
        unique: false,
        options: {
          min: 1,
          max: 50,
          pattern: ""
        }
      },
      {
        name: "room",
        type: "relation",
        required: true,
        unique: false,
        options: {
          collectionId: rooms.id,
          cascadeDelete: true
        }
      },
      {
        name: "role",
        type: "text",
        required: false,
        unique: false,
        options: {}
      },
      {
        name: "isMaster",
        type: "bool",
        required: false,
        unique: false,
        options: {}
      }
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  })

  dao.saveCollection(players)
})
