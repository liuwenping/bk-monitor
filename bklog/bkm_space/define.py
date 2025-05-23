# -*- coding: utf-8 -*-
from dataclasses import asdict, dataclass, fields
from enum import Enum
from typing import Union

from django.conf import settings


class SpaceTypeEnum(Enum):
    """
    空间类型枚举
    """

    BKCC = "bkcc"  # CMDB 业务
    BCS = "bcs"  # BCS
    BKCI = "bkci"  # 蓝盾
    BKSAAS = "bksaas"  # 蓝鲸应用


@dataclass
class Space:
    """
    空间格式
    """

    to_dict = asdict

    id: int
    space_type_id: str
    space_id: str
    space_name: str
    status: str
    space_code: Union[None, str]
    space_uid: str
    type_name: Union[None, str]
    bk_biz_id: int
    extend: dict

    bk_tenant_id: str = settings.DEFAULT_TENANT_ID

    @classmethod
    def from_dict(cls, data):
        init_fields = {f.name for f in fields(cls) if f.init}
        filtered_data = {k: data.pop(k, None) for k in init_fields}
        if filtered_data["space_type_id"] == SpaceTypeEnum.BKCC.value:
            filtered_data["bk_biz_id"] = int(filtered_data["space_id"])
        else:
            filtered_data["bk_biz_id"] = -int(filtered_data["id"])
        instance = cls(**filtered_data)
        setattr(instance, "extend", data)
        return instance
