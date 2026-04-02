import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing',
    }),
    CredentialsProvider({
      name: 'Developer Login',
      credentials: {
        password: { label: "Dev Password", type: "password" }
      },
      async authorize(credentials) {
        // Fallback for local development testing so you aren't blocked by missing Google OAuth variables
        if (credentials?.password === 'devmode123') {
          return { id: "1", name: "Dev Admin", email: "joel@marketinghosting.agency" };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email === 'joel@marketinghosting.agency') {
        return true;
      }
      return false; 
    },
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  // Use a fallback secret for local development if NEXTAUTH_SECRET isn't defined
  secret: process.env.NEXTAUTH_SECRET || 'local-dev-fallback-secret-123456789',
});

export { handler as GET, handler as POST };
