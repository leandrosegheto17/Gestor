import NextAuth from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"

const handler = NextAuth(opcoesAutenticacao)

export { handler as GET, handler as POST }
