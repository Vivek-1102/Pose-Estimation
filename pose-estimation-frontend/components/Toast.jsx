"use client"

import { useState, useEffect } from "react"
import { CheckCircle, X, AlertTriangle, Info } from "lucide-react"

export const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose && onClose()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-white" />
      case "error":
        return <AlertTriangle className="w-5 h-5 text-white" />
      case "info":
        return <Info className="w-5 h-5 text-white" />
      default:
        return <CheckCircle className="w-5 h-5 text-white" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "info":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg shadow-lg transition-opacity duration-300 ${getBgColor()} ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">{getIcon()}</div>
      <div className="ml-3 text-sm font-normal text-white">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 text-white hover:bg-white hover:bg-opacity-20"
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => {
            onClose && onClose()
          }, 300)
        }}
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  )
}

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
