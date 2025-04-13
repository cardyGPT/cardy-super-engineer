
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 20
const TOAST_REMOVE_DELAY = 10000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Initialize the state
const initialState: State = { toasts: [] }

// Create a React context to manage the toast state
const ToastContext = React.createContext<{
  state: State
  dispatch: React.Dispatch<Action>
} | undefined>(undefined)

// Global dispatch function
let dispatch: React.Dispatch<Action> = () => {}

// Create a ToastProvider to wrap the application
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatchAction] = React.useReducer(reducer, initialState)
  
  // Set the global dispatch
  React.useEffect(() => {
    dispatch = dispatchAction
  }, [dispatchAction])
  
  return React.createElement(
    ToastContext.Provider,
    { value: { state, dispatch: dispatchAction } },
    children
  )
}

// Create a context hook to use the toast context
function useToastContext() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

type Toast = Omit<ToasterToast, "id">

function useToast() {
  const { state, dispatch } = useToastContext();

  const toast = React.useCallback(
    (props: Toast) => {
      const id = genId()

      const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
      const update = (props: ToasterToast) =>
        dispatch({
          type: "UPDATE_TOAST",
          toast: { ...props, id },
        })

      dispatch({
        type: "ADD_TOAST",
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        },
      })

      return {
        id,
        dismiss,
        update,
      }
    },
    [dispatch]
  )

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

// This is a function outside of a component to create a toast
// without having to use the hook directly
let toastCreator: ((props: Toast) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void }) | undefined

// Listeners for the standalone toast function
const listeners: Array<(state: State) => void> = []

// Initialize toast function if needed
function initializeToast() {
  if (!toastCreator && typeof window !== 'undefined') {
    // We're exporting toast as a function, not a hook.
    // We need a global dispatch function outside the component lifecycle.
    // Create a standalone version
    const toasts: ToasterToast[] = []
    
    toastCreator = (props: Toast) => {
      const id = genId()
      
      const newToast: ToasterToast = {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss()
        },
      }
      
      toasts.push(newToast)
      
      // Trigger any listeners
      listeners.forEach((listener) => {
        listener({ toasts: [...toasts] })
      })
      
      // Set timeout to remove
      setTimeout(() => {
        const index = toasts.findIndex(t => t.id === id)
        if (index !== -1) {
          toasts.splice(index, 1)
          listeners.forEach((listener) => {
            listener({ toasts: [...toasts] })
          })
        }
      }, TOAST_REMOVE_DELAY)
      
      function dismiss() {
        const index = toasts.findIndex(t => t.id === id)
        if (index !== -1) {
          toasts[index].open = false
          listeners.forEach((listener) => {
            listener({ toasts: [...toasts] })
          })
          
          setTimeout(() => {
            const currentIndex = toasts.findIndex(t => t.id === id)
            if (currentIndex !== -1) {
              toasts.splice(currentIndex, 1)
              listeners.forEach((listener) => {
                listener({ toasts: [...toasts] })
              })
            }
          }, 300) // Animation time
        }
      }
      
      function update(props: ToasterToast) {
        const index = toasts.findIndex(t => t.id === id)
        if (index !== -1) {
          toasts[index] = { ...toasts[index], ...props }
          listeners.forEach((listener) => {
            listener({ toasts: [...toasts] })
          })
        }
      }
      
      return {
        id,
        dismiss,
        update,
      }
    }
  }
  
  return toastCreator
}

// Toast function for use outside of components
export function toast(props: Toast) {
  const toastFn = initializeToast()
  if (!toastFn) {
    throw new Error('Toast function not initialized. Make sure to use ToastProvider at the root of your app.')
  }
  return toastFn(props)
}

// Update use-toast.ts file to re-export toast function
export { useToast }
export type { Toast }
