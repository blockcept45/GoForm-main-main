// pages/protected.js
import { getSession } from "next-auth/react";

export default function Protected({ user }) {
  return (
    <div>
      <h1>Protected Page</h1>
      <p>Welcome {user.name}</p>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: session.user,
    },
  };
}
