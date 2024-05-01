import React, { Fragment } from 'react'

const CtaButton = (props) => {
    return (
        <Fragment>
            <button
                onClick={props.onClick}
                className='bg-orangeLight uppercase font-poppins font-medium px-7 tracking-wide p-3 text-white w-full '>
                {props.children}
            </button>
        </Fragment>
    )
}

export default CtaButton