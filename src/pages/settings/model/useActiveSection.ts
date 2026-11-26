import { useEffect, useState } from 'react'

/**
 * Which section is in view, for highlighting its link. A section counts once its
 * top passes the line under the sticky bars; the last one passed wins.
 */
export function useActiveSection(ids: readonly string[], offset = 160): string {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    function update() {
      let current = ids[0] ?? ''
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top
        if (top !== undefined && top - offset <= 0) current = id
      }
      // At the very bottom the last short sections can never reach the line.
      const atEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4
      setActive(atEnd && window.scrollY > 0 ? (ids.at(-1) ?? current) : current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ids, offset])

  return active
}
