import { useEffect, useState } from 'react'
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => matchMedia('(pointer: coarse)').matches)
  useEffect(() => { const query = matchMedia('(pointer: coarse)'); const update = () => setMobile(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update) }, [])
  return mobile
}
