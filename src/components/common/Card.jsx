import React from 'react'

const Card = ({item}) => {
    return (
        <div className="mr-4 lg:hover:scale-[0.92] transition-all cursor-pointer">
            <img src={item.image} alt="food_category_card" className="h-[160px] object-cover lg:w-[280px] w-full rounded-[12px]" />
            <div className="flex flex-col mt-2">
                <p className="text-lg font-poppins font-medium  text-footerDark">{item.name}</p>
                <div className="flex items-center gap-2">
                    <img src="/icons/rating.svg" alt="rating" className="w-5 h-5" />
                    <p className="text-base text-[#292929] font-poppins font-regular">{item.rating}</p>
                </div>
                <p className="text-sm text-[#808080] font-poppins font-regular">{item.description}</p>
                <p className="text-sm text-[#808080] font-poppins font-regular">{item.location}</p>
            </div>
        </div>
    )
}

export default Card