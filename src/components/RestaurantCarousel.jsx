import React from 'react'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import ButtonGroup from './common/ButtonGroup'
import { popularRestaurants } from '@/utils/helpers'
import Link from 'next/link'

const RestaurantCarousel = () => {
  return (
    <Carousel
      additionalTransfrom={0}
      arrows={false}
      autoPlaySpeed={3000}
      centerMode={false}
      className=""
      containerClass="container"
      dotListClass=""
      draggable
      focusOnSelect={false}
      infinite
      itemClass=""
      keyBoardControl
      minimumTouchDrag={80}
      partialVisible
      pauseOnHover
      renderArrowsWhenDisabled={false}
      renderButtonGroupOutside={true}
      customButtonGroup={<ButtonGroup />}
      renderDotsOutside={false}
      responsive={{
        desktop: {
          breakpoint: {
            max: 3000,
            min: 1024,
          },
          items: 3.5,
          partialVisibilityGutter: 40,
        },
        mobile: {
          breakpoint: {
            max: 464,
            min: 0,
          },
          items: 1,
          partialVisibilityGutter: 20,
        },
        tablet: {
          breakpoint: {
            max: 1024,
            min: 464,
          },
          items: 2,
          partialVisibilityGutter: 30,
        },
      }}
      rewind={false}
      rewindWithAnimation={false}
      rtl={false}
      shouldResetAutoplay
      showDots={false}
      sliderClass=""
      slidesToSlide={1}
      swipeable
    >
      {React.Children.toArray(
        popularRestaurants.map((item) => (
          <Link
            // href={'/restaurants/view/' + item.name}
            href={{
              pathname: '/restaurants/view/' + item.name,
              query: {
                id: item.id,
                name: item.name,
                description: item.description,
                rating: item.rating,
                location: item.location,
              },
            }}
          >
            <div className="mr-4 lg:hover:scale-[0.9] transition-all cursor-pointer">
              <img
                src={item.image}
                alt="food_category_card"
                className="h-[170px] object-cover w-[290px] rounded-[12px]"
              />
              <div className="flex flex-col mt-2">
                <p className="text-lg font-poppins font-medium  text-footerDark">
                  {item.name}
                </p>
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/rating.svg"
                    alt="rating"
                    className="w-5 h-5"
                  />
                  <p className="text-base text-[#292929] font-poppins font-regular">
                    {item.rating}
                  </p>
                </div>
                <p className="text-sm text-[#808080] font-poppins font-regular">
                  {item.description}
                </p>
                <p className="text-sm text-[#808080] font-poppins font-regular">
                  {item.location}
                </p>
              </div>
            </div>
          </Link>
        )),
      )}
    </Carousel>
  )
}

export default RestaurantCarousel
