# EduCRM Frontend — Next.js

## Texnologiyalar
- **Next.js 15** — React framework
- **Tailwind CSS** — Styling
- **Zustand** — State management
- **Axios** — API calls
- **React Hot Toast** — Notifications
- **Lucide React** — Icons
- **Vercel** — Hosting

---

## Sahifalar

### O'quvchi (Student)
| Sahifa | URL |
|--------|-----|
| Bosh sahifa | `/student` |
| Guruhlarim | `/student/groups` |
| To'lovlarim | `/student/payments` |
| Ko'rsatkichlarim | `/student/homework` |
| Reyting | `/student/ratings` |
| Qo'shimcha darslar | `/student/extra` |
| Bildirishnomalar | `/student/notifications` |
| Sozlamalar | `/student/settings` |

### O'qituvchi (Teacher)
| Sahifa | URL |
|--------|-----|
| Bosh sahifa | `/teacher` |
| Guruhlarim | `/teacher/groups` |
| Uyga vazifalar | `/teacher/homework` |
| Davomat | `/teacher/attendance` |

### Admin
| Sahifa | URL |
|--------|-----|
| Bosh sahifa | `/admin` |
| O'quvchilar | `/admin/students` |
| O'qituvchilar | `/admin/teachers` |
| Guruhlar | `/admin/groups` |
| To'lovlar | `/admin/payments` |
| Reyting | `/admin/ratings` |
| Bildirishnomalar | `/admin/notifications` |

---

## Ishga tushirish

```bash
npm install
cp .env.example .env.local
# .env.local ni to'ldiring
npm run dev
```

---

## Vercel Deploy

1. Vercel.com da yangi project yaratish
2. GitHub repo ulash
3. Environment: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`
4. Deploy!
