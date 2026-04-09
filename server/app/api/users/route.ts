import db from '@/db'
import { NextResponse } from 'next/server'
import { userProviders, users } from '@/db/schema'
import isEmail from 'validator/lib/isEmail'

export async function POST(req: Request) {
  const data = await req.json()
  if (!data)
    return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  const { email, provider, providerId } = data

  if (!email || !provider || !providerId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  if (email.length > 150) {
    return NextResponse.json(
      { error: 'Email exceeds maximum length' },
      { status: 400 },
    )
  }

  if (!isEmail(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  try {
    let existingUser

    if (provider === 'apple' || provider === 'google') {
      const result = await db.query.userProviders.findFirst({
        where: (userProvider, { eq, and }) =>
          and(
            eq(userProvider.provider, provider),
            eq(userProvider.providerId, providerId),
          ),
        with: {
          user: {
            with: {
              userProviders: true,
            },
          },
        },
      })
      existingUser = result?.user
    }

    if (existingUser) {
      const providers = existingUser.userProviders.map((p) => p.provider)

      if (providers.includes(provider)) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 },
        )
      }

      if (providers.includes('google')) {
        return NextResponse.json(
          { error: 'Google account already exists' },
          { status: 409 },
        )
      } else if (provider === 'apple') {
        return NextResponse.json(
          { error: 'Apple account already exists' },
          { status: 409 },
        )
      }
    }

    const createdUser = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          username: `${email.split('@')[0]}${Math.floor(Math.random() * 1000)}`, // default username from email prefix
          email,
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
        })

      await tx
        .insert(userProviders)
        .values({
          userId: newUser.id,
          provider,
          providerId,
          providerEmail: email,
        })
        .onConflictDoNothing({
          target: [userProviders.userId, userProviders.provider],
        })

      return newUser
    })

    const completeUser = {
      id: createdUser.id,
      email: createdUser.email,
      username: createdUser.username,
      provider,
      providerId,
      providerEmail: email,
    }

    return NextResponse.json(completeUser, {
      status: 201,
    })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
