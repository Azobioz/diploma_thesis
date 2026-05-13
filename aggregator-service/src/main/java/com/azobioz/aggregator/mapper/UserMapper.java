package com.azobioz.aggregator.mapper;

import com.azobioz.aggregator.dto.user.UserDto;
import com.azobioz.aggregator.dto.user.UserInfoDto;

public class UserMapper {

    public static UserDto mapToUserDto(UserInfoDto userInfoDto) {
        return new UserDto(
                userInfoDto.getUserId(),
                userInfoDto.getNickname(),
                userInfoDto.getAvatar()
        );
    }

}
