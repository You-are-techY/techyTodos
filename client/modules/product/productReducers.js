/**
 * Build the Product store
 *
 * Follows best practices from Redux documentation:
 *   - Single source of truth
 *   - State/Store is read-only
 *   - Changes are made with pure functions
 *
 * See http://redux.js.org/docs/recipes/StructuringReducers.html for specific
 * docs on structuring reducers
 *
 * NOTE: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import product actions
import * as Actions from './productActions';

/**
 * productList reducer -
 *
 * Accepts arbitrary list arguments and recursively builds nested list as needed
 *
 * NOTE: this is never called directly. Only by parent 'product' reducer (defined
 * below) when dealing with a LIST action
 */
function productList(state = {
  /**
   * The "items" object defines the default state for a list
   *
   * NOTE: This is for reference only. The list is not actually initialized here.
   * The actual init happens the first time REQUEST_LIST is called.
   */
  items: [] // array of _id's
  , isFetching: false
  , error: null
  , didInvalidate: false
  , lastUpdated: null
  , pagination: {}
  , filter: {}

}, action) {
  // console.log("DEBUG", state, action.listArgs);
  let nextAction = JSON.parse(JSON.stringify(action)); // Only change copy. NOT the  original object
  nextAction.listArgs.shift();

  /**
   * Check for nested list --
   * If the action is asking for a nested state, like lists[workout][123ABC],
   * then recursively return an _additional_ productList reducer.
   *
   * Otherwise, return the actual product lists' store
   */
  if(nextAction.listArgs.length > 0) {
    /**
     * The action is asking for a nested state, like lists[workout][123ABC].
     * Let's nest it by returning an additional productList reducer and trying again.
     */
    return Object.assign({}, state, {
      [nextAction.listArgs[0]]: productList(state[nextAction.listArgs[0]] || {}, nextAction)
    })
  } else {
    /**
     * Stop nesting. Instead listen for the actions and respond accordingly.
     */
    switch(action.type) {
      case Actions.INVALIDATE_PRODUCT_LIST: {
        return Object.assign({}, state, {
          didInvalidate: true
        })
      }
      case Actions.REQUEST_PRODUCT_LIST: {
        return Object.assign({}, state, {
          items: [] // array of _id's
          , isFetching: true
          , error: null
          , lastUpdated: null
          , pagination: state.pagination || {}
          , filter: state.filter || {}
        })
      }
      case Actions.RECEIVE_PRODUCT_LIST: {
        if(!action.success) {
          return Object.assign({}, state, {
            items: [] // array of _id's
            , isFetching: false
            , error: action.error
            , lastUpdated: action.receivedAt
          })
        } else {
          let idArray = [];
          for(const item of action.list) {
            idArray.push(item._id);
          }
          return Object.assign({}, state, {
            items: idArray
            , isFetching: false
            , error: action.error || null
            , didInvalidate: false
            , lastUpdated: action.receivedAt
          })
        }
      }
      case Actions.SET_PRODUCT_FILTER: {
        return Object.assign({}, state, {
          filter: action.filter
        })
      }
      case Actions.SET_PRODUCT_PAGINATION: {
        return Object.assign({}, state, {
          pagination: action.pagination
        })
      }
      default:
        return state;
    }
  }
}

/**
 * Primary product reducer -
 *
 * This is the single source of truth for all things 'product' related within the
 * application. The primary components of the reducer are defined in detail below.
 *
 * The basic idea is that the reducer listens for actions indicating a desired
 * state change and the reducer returns a new _copy_ of the state accordingly.
 */
function product(state = {

  /**
   * "defaultItem" defines fields for a _new_ product
   * any component that creates a new product object should store a copy of this
   * in its state
   */
  defaultItem: {
    title: ''
    , description: ''
  }

  /**
   * "byId" is an object map of all product items in the store. The map's keys are
   * the Mongo ids of the objects by default
   */
  , byId: {}

  /**
   * "selected" is a single _selected_ entity within the store
   *
   * For example, when changing the name of a product, the single product
   * being edited would be defined by "selected"
   */
  , selected: {
    id: null
    , isFetching: false
    , error: null
    , didInvalidate: false
    , lastUpdated: null
  }

  /**
   * "lists" corresponds to individual instances of the productList reducer as
   * defined above.
   *
   * NOTE: when requesting a list, if args are undefined, the lists defaults to
   * lists['all']
   */
  , lists: {}

}, action) {
  /**
   * Listen for the actions and respond accordingly.
   */
  switch(action.type) {
    /**
     * SINGLE PRODUCT ACTIONS
     */
    case Actions.REQUEST_SINGLE_PRODUCT: {
      return Object.assign({}, state, {
        selected: {
          id: action.id
          , isFetching: true
          , error: null
        }
      })
    }
    case Actions.RECEIVE_SINGLE_PRODUCT: {
      if(action.success) {
        // add received object to map
        let newIdMap = Object.assign({}, state.byId, {});
        newIdMap[action.id] = action.item;
        return Object.assign({}, state, {
          byId: newIdMap
          , selected: {
            id: action.id
            , isFetching: false
            , error: null
            , didInvalidate: false
            , lastUpdated: action.receivedAt
          }
        })
      } else {
        let selected = Object.assign({}, state.selected, {
          isFetching: false
          , error: action.error
          , lastUpdated: action.receivedAt
        })
        return Object.assign({}, state, selected);
      }
    }
    case Actions.ADD_SINGLE_PRODUCT_TO_MAP: {
      // deliberately add this product to the map
      let newIdMap = Object.assign({}, state.byId, {}); // copy map
      newIdMap[action.item._id] = action.item; // add single
      return Object.assign({}, state, {
        byId: newIdMap
      })
    }
    case Actions.REQUEST_CREATE_PRODUCT: {
      return Object.assign({}, state, {
        selected: {
          id: null
          , isFetching: true
          , error: null
        }
      })
    }
    case Actions.RECEIVE_CREATE_PRODUCT: {
      if(action.success) {
        // add received object to map
        let newIdMap = Object.assign({}, state.byId, {});
        newIdMap[action.id] = action.item;
        return Object.assign({}, state, {
          byId: newIdMap
          , selected: {
            id: action.id
            , isFetching: false
            , error: null
            , didInvalidate: false
            , lastUpdated: action.receivedAt
          }
        })
      } else {
        return Object.assign({}, state, {
          selected: {
            id: action.id
            , isFetching: false
            , error: action.error
            , didInvalidate: true
            , lastUpdated: action.receivedAt
          }
        })
      }
    }
    case Actions.REQUEST_UPDATE_PRODUCT: {
      return Object.assign({}, state, {
        selected: {
          id: action.id
          , isFetching: true
          , error: null
        }
      })
    }
    case Actions.RECEIVE_UPDATE_PRODUCT: {
      if(action.success) {
        // add received object to map
        let newIdMap = Object.assign({}, state.byId, {});
        newIdMap[action.id] = action.item;
        return Object.assign({}, state, {
          byId: newIdMap
          , selected: {
            id: action.id
            , isFetching: false
            , error: null
            , didInvalidate: false
            , lastUpdated: action.receivedAt
          }
        })
      } else {
        return Object.assign({}, state, {
          selected: {
            id: action.id
            , isFetching: false
            , error: action.error
            , didInvalidate: true
            , lastUpdated: action.receivedAt
          }
        })
      }
    }
    case Actions.REQUEST_DELETE_PRODUCT: {
      return Object.assign({}, state, {
        selected: {
          id: action.id
          , isFetching: true
          , error: null
        }
      })
    }
    case Actions.RECEIVE_DELETE_PRODUCT: {
      if(action.success) {
        // remove this object from map
        let newIdMap = Object.assign({}, state.byId, {});
        delete newIdMap[action.id]; //remove key
        return Object.assign({}, state, {
          byId: newIdMap
          , selected: {
            id: null
            , isFetching: false
            , error: null
            , didInvalidate: false
            , lastUpdated: action.receivedAt
          }
        })
      } else {
        return Object.assign({}, state, {
          selected: {
            id: action.id
            , isFetching: false
            , error: action.error
            , didInvalidate: true
            , lastUpdated: action.receivedAt
          }
        })
      }
    }
    case Actions.INVALIDATE_SELECTED_PRODUCT: {
      return Object.assign({}, state, {
        selected: {
          didInvalidate: true
        }
      })
    }

    /**
     * LIST ACTIONS
     */
    case Actions.INVALIDATE_PRODUCT_LIST:
    case Actions.REQUEST_PRODUCT_LIST:
    case Actions.SET_PRODUCT_FILTER:
    case Actions.SET_PRODUCT_PAGINATION: {
      // forward these actions on to individual list reducer
      let nextLists = Object.assign({}, state.lists, {});
      return Object.assign({}, state, {
        lists: Object.assign({}, state.lists, {
          // NOTE:  This is a badass line of elegant code right here
          [action.listArgs[0]]: productList(state.lists[action.listArgs[0]] || {}, action)
        })
      })
    }
    case Actions.RECEIVE_PRODUCT_LIST: {
      // add items to "byId" before we forward to individual list reducer
      let newIdMap = Object.assign({}, state.byId, {});
      if(action.success) {
        for(const item of action.list) {
          newIdMap[item._id] = item;
        }
      }
      return Object.assign({}, state, {
        byId: newIdMap
        , lists: Object.assign({}, state.lists, {
          [action.listArgs[0]]: productList(state.lists[action.listArgs[0]], action)
        })
      })
    }
    default: {
      return state
    }
  }
}

export default product;