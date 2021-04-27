// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.8;
pragma experimental ABIEncoderV2;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract AddressRegistry is Ownable {
    mapping(address=>bool) isAdmin;

    constructor() public {
        isAdmin[msg.sender] = true;
    }

    function setAdmin(address _ad) public onlyOwner {
        isAdmin[_ad] = true;
    }

    function revokeAdmin(address _ad) public onlyOwner {
        isAdmin[_ad] = false;
    }

    function setAdmins(address[] memory _ads) public onlyOwner {
        for (uint256 i = 0; i < _ads.length; i++) {
            isAdmin[_ads[i]] = true;
        }
    }

    function revokeAdmin(address[] memory _ads) public onlyOwner {
        for (uint256 i = 0; i < _ads.length; i++) {
            isAdmin[_ads[i]] = false;
        }
    }
}