import './custom.css'

export default function EventDetailsPage ({
    children,
}: {
    children: React.ReactNode;
}) {
    return(
        <div className="bg-layout md:container md:max-w-[80rem]  md:mx-auto">
            {children}
        </div>
    )
}