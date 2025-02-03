

const AuthLayout = ({
    children
}: {
    children: React.ReactNode
}) => {
    return (
        //<div className="h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-orange-100 to-orange-300">
         <div className="h-full bg-transparent flex items-center justify-center">  
            {children}
        </div>
    )
}

export default AuthLayout;