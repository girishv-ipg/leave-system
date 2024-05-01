

const RightArrow = () => {
    return (
        <img src="/icons/rightArrow.svg" alt="rightArrow" className="w-4 h-4" />
    )
}


const ButtonGroup = ({ next, previous, goToSlide, ...rest }) => {
    const { carouselState: { currentSlide } } = rest;
    return (
        <div className="lg:flex hidden gap-3 items-center">
            <button
                className='bg-gray-200 rounded-full p-2 -rotate-180 absolute top-0 right-10 shadow'
                onClick={() => previous()}>
                <RightArrow />
            </button>
            <button
                className=' bg-gray-200 rounded-full p-2 absolute top-0 right-0 shadow'
                onClick={() => next()}>
                <RightArrow />
            </button>
        </div>

    );
};

export default ButtonGroup