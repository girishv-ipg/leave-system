import React, { Fragment, useState } from 'react'
import Header from './common/Header'
import Link from 'next/link'
import { useRouter } from 'next/router'

const Breadcrumb = ({ crumbs }) => {
  return (
    <div className="flex items-center gap-2">
      {React.Children.toArray(
        crumbs.map((item, index) => (
          <Link href={item.link}>
            <p
              className={`text-xs font-poppins font-medium ${
                index === 2 ? 'text-footerDark' : 'text-[#909090]'
              }`}
            >
              {item.name}
            </p>
          </Link>
        )),
      )}
    </div>
  )
}

const OfferCard = () => {
  return (
    <div className="w-[235px] rounded-lg p-3 shadow border border-gray-300">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-slate-500" />
        <p className="uppercase font-poppins text-xs font-medium">
          20% OFF upto <span className="capitalize">Rs.</span>100
        </p>
      </div>
      <p className="uppercase font-poppins text-xs mt-1 text-[#808080]">
        NO CODE REQUIRED | ABOVE <span className="capitalize">Rs.</span> 249
      </p>
    </div>
  )
}

const FoodType = ({ type }) => {
  return (
    <div className="">
      {type === 'veg' ? (
        <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-green-600" />
        </div>
      ) : (
        <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-red-600" />
        </div>
      )}
    </div>
  )
}

const MenuItem = ({ data }) => {
  const [count, setCount] = useState(0)

  const incr = () => {
    setCount(count + 1)
  }
  const decr = () => {
    setCount(count - 1)
  }

  return (
    <div className="flex md:flex-row flex-col-reverse lg:items-start lg:justify-between mt-2">
      <div className="lg:w-8/12 w-full flex flex-col justify-between">
        <FoodType type="veg" />
        <h1 className="font-poppins lg:text-base text-[#2f2f2f] font-medium">
          Grilled Lamb Burger Combo
        </h1>
        <p className="text-sm font-poppins font-thin text-[#2f2f2f]">Rs. 460</p>

        <p className="text-xs font-poppins font-thin text-[#808080] mt-2">
          Save 14% with this combo of grilled lamb burger combo, our signature
          grilled lamb burger patty topped with crunchy lettuce, cheese, and
          onions served with garlic mayo on a toasted burger bun served with 2pc
          of peri peri chicken wings, along with fries & 250 ml beverage.
        </p>
      </div>

      <div className="relative">
        <img
          src="/restaurants/mcdonalds.webp"
          alt="mcdonalds"
          className="md:w-[160px] w-full lg:h-[110px] h-[150px] object-cover rounded-lg"
        />

        <div className="flex items-center -mt-5 justify-center">
          <button className="bg-white shadow border rounded w-[70px] py-1 font-poppins text-sm font-medium text-[#21973B]  px-5 uppercase hover:text-swiggyOrange flex items-center justify-center">
            {count === 0 ? (
              <span onClick={incr}>Add</span>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span
                  onClick={decr}
                  className="font-poppins text-sm font-semibold text-[#808080]"
                >
                  -
                </span>
                <span className="font-poppins text-sm font-semibold text-[#21973B]">
                  {count}
                </span>
                <span
                  onClick={incr}
                  className="font-poppins text-sm font-semibold text-[#21973B]"
                >
                  +
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

const ViewRestaurant = () => {
  const { query } = useRouter()

  const crumbs = [
    {
      name: 'Restaurants /',
      link: '/restaurants',
    },

    {
      name: 'Bangalore /',
      link: '#',
    },

    {
      name: query.slug,
      link: '#',
    },
  ]

  const [show, setShow] = useState(true)

  const myToggler = () => {
    setShow(!show)
  }

  return (
    <Fragment>
      <Header />
      <div className="lg:mt-10 mt-5 lg:w-[960px] m-auto lg:px-0 px-5">
        <Breadcrumb crumbs={crumbs} />

        <div className="flex items-start justify-between lg:mt-7 mt-5">
          <div className="flex flex-col gap-1 item-start">
            <p className="font-poppins lg:text-xl text-lg font-medium">
              {query.name}
            </p>
            <p className="font-poppins text-xs text-[#808080]">
              {query.description}
            </p>
            <p className="font-poppins text-xs text-[#808080]">
              {query.location}
            </p>
          </div>

          <div className="border border-gray-300 shadow  h-20 rounded-lg p-2 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <img src="/icons/star.svg" alt="starIcon" className="w-5 h-5" />
              <p className="lg:text-lg text-base font-poppins text-[#21973B] font-bold">
                {query.rating ?? 4.0}
              </p>
            </div>
            <hr className="border-b-1   border-gray-300" />
            <p className="text-xs font-poppins text-[#808080] font-medium">
              10K+ ratings
            </p>
          </div>
        </div>

        <hr className="my-5 border-b-1 border-gray-300" />

        <div className="my-5 flex items-center gap-5">
          <div className="flex items-center gap-2 opacity-70">
            <img src="/icons/clock.svg" alt="clockIcon" className="w-6 h-6" />
            <p className="text-base font-poppins font-bold text-footerDark">
              30 mins
            </p>
          </div>

          <div className="flex items-center gap-2 opacity-70">
            <img src="/icons/rupee.svg" alt="rupeeIcon" className="w-6 h-6" />
            <p className="text-base font-poppins font-bold text-footerDark">
              500 for two
            </p>
          </div>
        </div>

        <div className="flex lg:flex-row flex-col items-start lg:items-center gap-4 lg:gap-5">
          {React.Children.toArray([1, 1, 1].map((item) => <OfferCard />))}
        </div>

        {/* Food Category and items available in restaurant */}

        <hr className="my-5 border-b-1 border-gray-300" />

        <div className="">
          <div
            onClick={myToggler}
            className="flex items-center justify-between cursor-pointer"
          >
            <h1 className="font-poppins font-medium lg:text-lg text-base pointer-events-none">
              Burgers & Burger Combos (23)
            </h1>

            <div>
              {!show ? (
                <img
                  src="/icons/dropdown.svg"
                  alt="dropdownIcon"
                  className="w-5 h-5 cursor-pointer"
                />
              ) : (
                <img
                  src="/icons/dropdown.svg"
                  alt="dropdownIcon"
                  className="w-5 h-5 cursor-pointer -rotate-180"
                />
              )}
            </div>
          </div>
          {!show ? (
            <></>
          ) : (
            <div className="flex flex-col gap-4 my-4">
              {React.Children.toArray(
                [1, 1, 1, 1, 1, 1].map((item) => <MenuItem data={null} />),
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <button className="p-2 bg-[#5D8ED5] rounded-full fixed bottom-5">
          <div className="flex items-center-2 gap-2">
            <img
              src="/icons/spoon.svg"
              alt="spoon"
              className="w-5 h-5 invert"
            />
            <p className="uppercase text-white font-poppins text-sm font-medium">
              Browse menu
            </p>
          </div>
        </button>
      </div>
    </Fragment>
  )
}

export default ViewRestaurant
