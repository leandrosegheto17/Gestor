import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"

export const opcoesAutenticacao: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        usuario: { label: "Usuário", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credenciais) {
        if (
          credenciais?.usuario === process.env.GESTOR_USUARIO &&
          credenciais?.senha === process.env.GESTOR_SENHA
        ) {
          return { id: "1", name: "Gestor" }
        }
        return null
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
}
