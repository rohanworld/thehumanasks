export default function ForumsPage ({
    children,
}: {
    children: React.ReactNode;
}) {
    return(
        <div className="bg-layout lg:mx-auto">
            {children}
        </div>
    )
}