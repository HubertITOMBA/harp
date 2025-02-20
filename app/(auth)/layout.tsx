 {/* //  <div className="h-full flex bg-white items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-orange-100 to-orange-300">
 // <div className="h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-sky-400 to-blue-800" >
 // */}

const AuthLayout = ({
    children
}: {
    children: React.ReactNode
}) => {
    return (
      <>
        
          
           {/* <div className="fixed inset-0 bg-black bg-opacity-20 z-20 flex items-center justify-center p-4">  */}
            <div className="h-full w-full bg-black bg-opacity-20 z-20">
                {children}
           </div> 
         {/* </div> */}
      </>  
      
    )
}

export default AuthLayout;