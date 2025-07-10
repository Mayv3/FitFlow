import { toast, ToastOptions } from 'react-toastify'

const options: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

export const notify = {
  success:   (msg: string) => toast.success(msg, options),
  error:     (msg: string) => toast.error(msg, options),
  info:      (msg: string) => toast.info(msg, options),
  warning:   (msg: string) => toast.warn(msg, options),
  default:   (msg: string) => toast(msg, options),
}