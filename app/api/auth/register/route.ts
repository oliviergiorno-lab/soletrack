import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const body = await req.json()
  const { username, email, password, alertsEnabled } = body

  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })

  if (existing) {
    return NextResponse.json({ error: 'Utilisateur ou email déjà utilisé' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      alertsEnabled: alertsEnabled ?? false,
    },
  })

  return NextResponse.json({ id: user.id, username: user.username }, { status: 201 })
}

